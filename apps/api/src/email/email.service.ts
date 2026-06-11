import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Abstracción de envío de emails. En dev/test loguea a consola;
// cuando haya cuenta de Resend, este es el único archivo que cambia.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  private get webUrl(): string {
    return this.config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  async sendEmailVerification(to: string, token: string): Promise<void> {
    const link = `${this.webUrl}/verificar?token=${token}`;
    await this.deliver(
      to,
      'Verificá tu email',
      `Confirmá tu cuenta entrando a: ${link}`,
    );
  }

  private async deliver(
    to: string,
    subject: string,
    body: string,
  ): Promise<void> {
    // TODO Resend: reemplazar por el SDK cuando haya RESEND_API_KEY
    this.logger.log(`[EMAIL] para=${to} asunto="${subject}" :: ${body}`);
    await Promise.resolve();
  }
}
