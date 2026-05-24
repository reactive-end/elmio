import { InternalServerErrorException } from '@nestjs/common'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Utilidad centralizada para proteger API keys en reposo y recuperarlas
 * únicamente en tiempo de ejecución cuando se van a usar contra terceros.
 */
export class ApiKeyCipher {
  private static readonly algorithm = 'aes-256-gcm'
  private static readonly ivLength = 16

  /**
   * Cifra un valor usando AES-256-GCM y lo serializa como:
   * ivHex:authTagHex:encryptedTextHex
   */
  static encrypt(plainText: string): string {
    const masterKey = this.getMasterKey()
    const iv = randomBytes(this.ivLength)

    const cipher = createCipheriv(this.algorithm, masterKey, iv)
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ])

    const authTag = cipher.getAuthTag()

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
  }

  /**
   * Descifra un valor en formato ivHex:authTagHex:encryptedTextHex.
   */
  static decrypt(encryptedPayload: string): string {
    const parts = encryptedPayload.split(':')

    if (parts.length !== 3) {
      throw new InternalServerErrorException(
        'El formato de API key encriptada es inválido.',
      )
    }

    const [ivHex, authTagHex, encryptedTextHex] = parts

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const encryptedText = Buffer.from(encryptedTextHex, 'hex')

    const decipher = createDecipheriv(this.algorithm, this.getMasterKey(), iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  }

  /**
   * Permite convivencia temporal con datos legacy sin cifrar,
   * evitando romper lectura mientras se completa la rotación.
   */
  static decryptIfEncrypted(storedValue: string): string {
    if (!this.isEncryptedPayload(storedValue)) {
      return storedValue
    }

    return this.decrypt(storedValue)
  }

  private static isEncryptedPayload(value: string): boolean {
    const parts = value.split(':')

    if (parts.length !== 3) {
      return false
    }

    const [ivHex, authTagHex, encryptedTextHex] = parts
    const hexPattern = /^[0-9a-f]+$/i

    return (
      ivHex.length === 32 &&
      authTagHex.length === 32 &&
      encryptedTextHex.length > 0 &&
      encryptedTextHex.length % 2 === 0 &&
      hexPattern.test(ivHex) &&
      hexPattern.test(authTagHex) &&
      hexPattern.test(encryptedTextHex)
    )
  }

  private static getMasterKey(): Buffer {
    const rawMasterKey = process.env.ENCRYPTION_MASTER_KEY

    if (!rawMasterKey) {
      throw new InternalServerErrorException(
        'No existe ENCRYPTION_MASTER_KEY en variables de entorno.',
      )
    }

    const normalizedMasterKey = rawMasterKey.trim().replace(/^['"]|['"]$/g, '')
    const masterKey = this.parseMasterKey(normalizedMasterKey)

    if (masterKey.length !== 32) {
      throw new InternalServerErrorException(
        'ENCRYPTION_MASTER_KEY debe resolver exactamente 32 bytes (utf8/base64/hex).',
      )
    }

    return masterKey
  }

  /**
   * Permite configurar la llave maestra en distintos formatos válidos
   * sin cambiar la lógica de cifrado en el resto del sistema.
   */
  private static parseMasterKey(value: string): Buffer {
    const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/
    const hexPattern = /^[0-9a-fA-F]{64}$/

    if (base64Pattern.test(value) && value.length % 4 === 0) {
      const fromBase64 = Buffer.from(value, 'base64')
      if (fromBase64.length === 32) {
        return fromBase64
      }
    }

    if (hexPattern.test(value)) {
      const fromHex = Buffer.from(value, 'hex')
      if (fromHex.length === 32) {
        return fromHex
      }
    }

    return Buffer.from(value, 'utf8')
  }
}
