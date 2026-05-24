import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
export class MercantilService {
  private readonly logger = new Logger(MercantilService.name);

  private readonly baseUrl: string;

  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('MERCANTIL_API_BASE_URL') ||
      'https://imajev78v9.execute-api.us-east-2.amazonaws.com';

    this.apiKey = this.configService.get<string>('MERCANTIL_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn(
        'MERCANTIL_API_KEY no está configurado. Debes definirlo en el .env para consumir la API externa.',
      );
    }
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

  async postFile(
    path: string,
    fileFieldName: string,
    file: MulterFile,
    query?: QueryParams,
  ): Promise<unknown> {
    const formData = new FormData();
    const fileBlob = new Blob([new Uint8Array(file.buffer || Buffer.alloc(0))], {
      type: file.mimetype,
    });
    formData.append(fileFieldName, fileBlob, file.originalname);

    return this.post(path, formData, query);
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
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'MERCANTIL_API_KEY no configurado en variables de entorno',
      );
    }

    const url = this.buildUrl(path, options.query);
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
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

    const bodyForLog = options.body instanceof FormData
      ? '[FormData]'
      : options.body
        ? JSON.stringify(options.body)
        : 'undefined';

    this.logger.log(`[MERCANTIL REQUEST] ${method} ${url}`);
    this.logger.log(`[MERCANTIL HEADERS] ${JSON.stringify(headers)}`);
    this.logger.log(`[MERCANTIL BODY] ${bodyForLog}`);

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

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });

    this.logger.log(`[MERCANTIL RESPONSE] ${response.status} ${response.statusText}`);
    this.logger.log(`[MERCANTIL RESPONSE HEADERS] ${JSON.stringify(responseHeaders)}`);
    this.logger.log(`[MERCANTIL RESPONSE BODY] ${JSON.stringify(parsedBody)}`);

    if (!response.ok) {
      throw new HttpException(
        {
          statusCode: response.status,
          message: 'Error al consumir API de Mercantil',
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
    } catch (_error) {
      return { raw: rawText };
    }
  }
}
