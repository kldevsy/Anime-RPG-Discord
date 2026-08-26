/**
 * Logger simples para o pacote @workspace/db
 * Reutiliza o logger da aplicação se disponível, senão usa console
 */

interface Logger {
  info: (msg: any, message?: string) => void;
  warn: (msg: any, message?: string) => void;
  error: (msg: any, message?: string) => void;
}

class SimpleLogger implements Logger {
  info(msg: any, message?: string) {
    const text = message || (typeof msg === "string" ? msg : "");
    const data = typeof msg === "object" ? msg : {};
    console.log(`[db] ${text}`, Object.keys(data).length > 0 ? data : "");
  }

  warn(msg: any, message?: string) {
    const text = message || (typeof msg === "string" ? msg : "");
    const data = typeof msg === "object" ? msg : {};
    console.warn(`[db] ${text}`, Object.keys(data).length > 0 ? data : "");
  }

  error(msg: any, message?: string) {
    const text = message || (typeof msg === "string" ? msg : "");
    const data = typeof msg === "object" ? msg : {};
    console.error(`[db] ${text}`, Object.keys(data).length > 0 ? data : "");
  }
}

export const logger: Logger = new SimpleLogger();
