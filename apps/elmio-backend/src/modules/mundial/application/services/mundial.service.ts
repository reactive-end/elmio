import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationApiKeysService } from '../../../integration-api-keys/application/integration-api-keys.service';

export class MulterFile {
  fieldname!: string;
  originalname!: string;
  encoding!: string;
  mimetype!: string;
  size!: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

type RequestOptions = {
  query?: QueryParams;
  body?: Record<string, unknown> | FormData;
};

@Injectable()
export class MundialService {
  private readonly logger = new Logger(MundialService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly integrationApiKeysService: IntegrationApiKeysService,
  ) {
    this.baseUrl =
      this.configService.get<string>('MUNDIAL_API_BASE_URL') ||
      'http://apiqa.exelixitech.com:3003/api/v1';
  }

  async get(path: string, query?: QueryParams): Promise<unknown> {
    return this.request('GET', path, { query });
  }

  async post(
    path: string,
    body?: Record<string, unknown> | FormData,
    query?: QueryParams,
  ): Promise<unknown> {
    return this.request('POST', path, { query, body });
  }

  async put(
    path: string,
    body?: Record<string, unknown>,
    query?: QueryParams,
  ): Promise<unknown> {
    return this.request('PUT', path, { query, body });
  }

  async delete(path: string, query?: QueryParams): Promise<unknown> {
    return this.request('DELETE', path, { query });
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options: RequestOptions,
  ): Promise<unknown> {
    let apiKey = await this.integrationApiKeysService.getActivePlainValue(
      'mundial',
      'sysip',
    );

    if (!apiKey) {
      apiKey = this.configService.get<string>('MUNDIAL_API_KEY') || '';
    }

    if (!apiKey) {
      throw new InternalServerErrorException(
        'No existe una API key activa para Mundial / sysip ni variable de entorno MUNDIAL_API_KEY.',
      );
    }

    const url = this.buildUrl(path, options.query);
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
      apikey: apiKey,
      Accept: 'application/json',
    };

    if (options.body && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    let requestBody: BodyInit | undefined;
    if (options.body instanceof FormData) {
      requestBody = options.body;
    } else if (options.body) {
      requestBody = JSON.stringify(options.body);
    }

    const bodyForLog =
      options.body instanceof FormData
        ? '[FormData]'
        : options.body
          ? JSON.stringify(options.body)
          : 'undefined';

    this.logger.log(`[MUNDIAL REQUEST] ${method} ${url}`);
    this.logger.log(`[MUNDIAL BODY] ${bodyForLog}`);

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    });

    const rawText = await response.text();
    const contentType = response.headers.get('content-type') || '';

    const parsedBody = contentType.includes('application/json')
      ? this.safeParseJson(rawText)
      : { raw: rawText };

    this.logger.log(
      `[MUNDIAL RESPONSE] ${response.status} ${response.statusText}`,
    );
    this.logger.log(`[MUNDIAL RESPONSE BODY] ${JSON.stringify(parsedBody)}`);

    if (!response.ok) {
      throw new HttpException(
        {
          statusCode: response.status,
          message: 'Error al consumir API de La Mundial de Seguros',
          upstream: parsedBody,
        },
        response.status,
      );
    }

    return parsedBody;
  }

  private safeParseJson(rawText: string): unknown {
    try {
      return rawText ? JSON.parse(rawText) : {};
    } catch {
      return { raw: rawText };
    }
  }
}
