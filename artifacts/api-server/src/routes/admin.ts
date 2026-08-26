import { Router } from "express";
import { syncCharacterCatalog, hasCatalogChanged } from "@workspace/db";
import { CatalogCache } from "../services/CatalogCache";

const router = Router();

/**
 * POST /admin/sync-catalog
 * 
 * Força sincronização manual do catálogo de personagens.
 * Útil quando você quer garantir que as mudanças foram aplicadas imediatamente.
 */
router.post("/admin/sync-catalog", async (req, res) => {
  try {
    const hasChanges = hasCatalogChanged();
    const result = await syncCharacterCatalog({ force: true });
    
    // Invalida cache para refletir mudanças imediatamente
    CatalogCache.invalidate();

    res.json({
      success: true,
      message: hasChanges 
        ? "Catálogo sincronizado com sucesso" 
        : "Catálogo já estava atualizado, sincronização forçada aplicada",
      data: {
        charactersUpdated: result.insertedOrUpdated,
        skipped: result.skipped,
        reason: result.reason,
        hash: result.hash,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erro ao sincronizar catálogo",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /admin/catalog-status
 * 
 * Verifica status do catálogo e se há mudanças pendentes.
 */
router.get("/admin/catalog-status", async (req, res) => {
  try {
    const hasChanges = hasCatalogChanged();
    
    res.json({
      success: true,
      data: {
        hasPendingChanges: hasChanges,
        message: hasChanges 
          ? "Há mudanças pendentes no catálogo" 
          : "Catálogo está sincronizado",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erro ao verificar status do catálogo",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
