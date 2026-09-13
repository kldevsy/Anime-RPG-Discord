/**
 * Logger simples para o pacote @workspace/db
 * Reutiliza o logger da aplicação se disponível, senão usa console
 */
interface Logger {
    info: (msg: any, message?: string) => void;
    warn: (msg: any, message?: string) => void;
    error: (msg: any, message?: string) => void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map