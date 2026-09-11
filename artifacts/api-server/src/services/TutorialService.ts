import { db } from "@workspace/db";
import { users, userTutorial, userCharacters, characters } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";

// =============================================
// TIPOS
// =============================================

export interface TutorialStep {
  id: string;
  step: number;
  title: string;
  description: string;
  objective: string;
  command?: string;
  emoji: string;
  category: "básico" | "batalha" | "avançado" | "personalização" | "final";
  reward: {
    gold?: number;
    gems?: number;
    tickets?: number;
    guaranteedCharacter?: {
      rarity: string;
      description: string;
    };
  };
}

export interface TutorialProgress {
  userId: string;
  currentStep: number;
  completedSteps: string[];
  isCompleted: boolean;
  skipped: boolean;
  startedAt: Date;
  completedAt: Date | null;
  nextStep: TutorialStep | null;
  totalRewards: {
    gold: number;
    gems: number;
    tickets: number;
  };
}

// =============================================
// STEPS DO TUTORIAL
// =============================================

export const TUTORIAL_STEPS: TutorialStep[] = [
  // BÁSICO
  {
    id: "step1_welcome",
    step: 1,
    title: "🎮 Bem-vindo ao Anime RPG!",
    description: "Olá! Bem-vindo ao mundo dos animes! Você está prestes a embarcar em uma aventura épica coletando personagens, formando equipes e batalhando contra outros jogadores.",
    objective: "Complete seu registro e ganhe sua primeira recompensa!",
    emoji: "👋",
    category: "básico",
    reward: {
      gold: 1000,
    },
  },
  {
    id: "step2_first_summon",
    step: 2,
    title: "🎲 Sua Primeira Invocação",
    description: "Todo jogador começa com tickets de invocação gratuitos! Use o comando `/invocar` para conseguir seus primeiros personagens.",
    objective: "Invoque pelo menos 1 personagem usando `/invocar`",
    command: "/invocar",
    emoji: "🎲",
    category: "básico",
    reward: {
      tickets: 3,
    },
  },
  {
    id: "step3_create_team",
    step: 3,
    title: "⚔️ Monte Sua Equipe",
    description: "Agora que você tem personagens, é hora de montar sua primeira equipe! Use `/equipe definir` para selecionar até 5 personagens que lutarão ao seu lado.",
    objective: "Monte sua primeira equipe com `/equipe definir`",
    command: "/equipe definir",
    emoji: "👥",
    category: "básico",
    reward: {
      gold: 1500,
    },
  },

  // BATALHA
  {
    id: "step4_first_battle",
    step: 4,
    title: "⚡ Primeira Batalha PvE",
    description: "Hora de testar sua equipe! Batalhe contra inimigos controlados pela IA. As batalhas têm mecânicas de elementos, posições e counters que afetam o dano.",
    objective: "Complete sua primeira batalha PvE com `/batalha`",
    command: "/batalha",
    emoji: "⚔️",
    category: "batalha",
    reward: {
      gold: 2000,
      gems: 10,
    },
  },
  {
    id: "step5_equipment",
    step: 5,
    title: "🛡️ Equipamentos e Poder",
    description: "Equipamentos aumentam os atributos dos seus personagens! Cada personagem pode equipar até 5 itens (Arma, Armadura, Acessório, Botas, Anel) com passivas especiais.",
    objective: "Equipe um item em um personagem com `/equipamento equipar`",
    command: "/equipamento equipar",
    emoji: "🛡️",
    category: "batalha",
    reward: {
      gems: 25,
    },
  },
  {
    id: "step6_arena",
    step: 6,
    title: "🏆 Arena PvP",
    description: "Desafie outros jogadores na Arena! O sistema é adaptativo: quanto mais você vence, mais forte os adversários ficam. Suba no ranking e ganhe recompensas!",
    objective: "Participe de uma batalha na Arena com `/arena`",
    command: "/arena",
    emoji: "🏆",
    category: "batalha",
    reward: {
      gold: 2500,
      gems: 15,
    },
  },

  // AVANÇADO
  {
    id: "step7_raid",
    step: 7,
    title: "🐉 Raids Cooperativas",
    description: "Raids são batalhas em grupo contra bosses épicos! Crie ou participe de uma raid com até 5 jogadores. Os bosses têm mecânicas especiais e fases.",
    objective: "Crie ou participe de uma raid com `/raid criar` ou `/raid participar`",
    command: "/raid criar",
    emoji: "🐉",
    category: "avançado",
    reward: {
      gold: 3000,
      gems: 20,
    },
  },

  // PERSONALIZAÇÃO
  {
    id: "step8_profile",
    step: 8,
    title: "🎨 Personalize seu Perfil",
    description: "Mostre seu estilo! Customize seu perfil com bio, anime favorito, cor, banner e showcase com seus 3 personagens favoritos.",
    objective: "Customize algo no seu perfil: `/perfil bio`, `/perfil cor`, `/perfil banner` ou `/perfil showcase`",
    command: "/perfil",
    emoji: "🎨",
    category: "personalização",
    reward: {
      gold: 2000,
      gems: 30,
    },
  },

  // DESAFIO FINAL
  {
    id: "step9_boss_rush",
    step: 9,
    title: "🔥 Boss Rush Challenge",
    description: "O desafio definitivo! Enfrente 5 bosses consecutivos sem curar entre as lutas. Quanto mais longe você chegar, melhores as recompensas. Há um ranking semanal!",
    objective: "Tente o Boss Rush com `/bossrush iniciar` (não precisa vencer todos)",
    command: "/bossrush iniciar",
    emoji: "🔥",
    category: "avançado",
    reward: {
      gold: 5000,
      gems: 50,
    },
  },

  // CONCLUSÃO
  {
    id: "step10_complete",
    step: 10,
    title: "🎉 Tutorial Completo!",
    description: "Parabéns! Você aprendeu todos os sistemas do Anime RPG! Agora você está pronto para:\n\n• Coletar todos os personagens\n• Dominar a Arena\n• Conquistar raids épicas\n• Subir nos rankings\n• Personalizar seu perfil\n• E muito mais!",
    objective: "Reivindique sua recompensa final épica!",
    emoji: "🎉",
    category: "final",
    reward: {
      gold: 10000,
      gems: 100,
      tickets: 5,
      guaranteedCharacter: {
        rarity: "SSR",
        description: "1 Personagem SSR Garantido do catálogo completo!",
      },
    },
  },
];

// =============================================
// TUTORIAL SERVICE
// =============================================

export async function getTutorialProgress(discordId: string): Promise<TutorialProgress | null> {
  // 1. Buscar usuário
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (!user) return null;

  // 2. Buscar ou criar progresso do tutorial
  let [tutorial] = await db
    .select()
    .from(userTutorial)
    .where(eq(userTutorial.userId, user.id))
    .limit(1);

  if (!tutorial) {
    // Criar progresso inicial
    [tutorial] = await db
      .insert(userTutorial)
      .values({
        userId: user.id,
        currentStep: 0,
        completedSteps: [],
        isCompleted: false,
        skipped: false,
        rewardsClaimed: {},
      })
      .returning();
  }

  // 3. Calcular próximo step
  const nextStepData = tutorial.isCompleted || tutorial.skipped
    ? null
    : TUTORIAL_STEPS.find((s) => s.step === tutorial!.currentStep + 1) || null;

  // 4. Calcular total de recompensas recebidas
  const totalRewards = tutorial.completedSteps.reduce(
    (acc, stepId) => {
      const step = TUTORIAL_STEPS.find((s) => s.id === stepId);
      if (step) {
        acc.gold += step.reward.gold || 0;
        acc.gems += step.reward.gems || 0;
        acc.tickets += step.reward.tickets || 0;
      }
      return acc;
    },
    { gold: 0, gems: 0, tickets: 0 }
  );

  return {
    userId: user.id,
    currentStep: tutorial.currentStep,
    completedSteps: tutorial.completedSteps,
    isCompleted: tutorial.isCompleted,
    skipped: tutorial.skipped,
    startedAt: tutorial.startedAt,
    completedAt: tutorial.completedAt,
    nextStep: nextStepData,
    totalRewards,
  };
}

export async function startTutorial(discordId: string): Promise<{ success: boolean; message: string; step?: TutorialStep }> {
  const progress = await getTutorialProgress(discordId);
  if (!progress) {
    return { success: false, message: "❌ Usuário não encontrado." };
  }

  if (progress.isCompleted) {
    return { success: false, message: "✅ Você já completou o tutorial!" };
  }

  if (progress.skipped) {
    return { success: false, message: "⏭️ Você pulou o tutorial. Use `/tutorial continuar` se quiser retomar." };
  }

  if (progress.currentStep > 0) {
    const currentStepData = TUTORIAL_STEPS.find((s) => s.step === progress.currentStep + 1);
    return {
      success: false,
      message: `📚 Você já está no tutorial! Step atual: **${progress.currentStep + 1}/10**`,
      step: currentStepData,
    };
  }

  // Avançar para step 1
  await advanceTutorialStep(discordId, "step1_welcome");

  return {
    success: true,
    message: "🎮 Tutorial iniciado! Bem-vindo ao Anime RPG!",
    step: TUTORIAL_STEPS[0],
  };
}

export async function advanceTutorialStep(discordId: string, stepId: string): Promise<{ success: boolean; message: string; reward?: any; nextStep?: TutorialStep | null }> {
  // 1. Buscar usuário
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (!user) {
    return { success: false, message: "❌ Usuário não encontrado." };
  }

  // 2. Buscar tutorial
  const [tutorial] = await db
    .select()
    .from(userTutorial)
    .where(eq(userTutorial.userId, user.id))
    .limit(1);

  if (!tutorial) {
    return { success: false, message: "❌ Tutorial não iniciado. Use `/tutorial iniciar`." };
  }

  if (tutorial.isCompleted) {
    return { success: false, message: "✅ Você já completou o tutorial!" };
  }

  if (tutorial.skipped) {
    return { success: false, message: "⏭️ Você pulou o tutorial." };
  }

  // 3. Validar step
  const step = TUTORIAL_STEPS.find((s) => s.id === stepId);
  if (!step) {
    return { success: false, message: "❌ Step inválido." };
  }

  // Verificar se já completou este step
  if (tutorial.completedSteps.includes(stepId)) {
    return { success: false, message: `✅ Você já completou este step: **${step.title}**` };
  }

  // Verificar se é o próximo step correto
  const expectedStep = tutorial.currentStep + 1;
  if (step.step !== expectedStep) {
    return { success: false, message: `⚠️ Complete o step ${expectedStep} primeiro!` };
  }

  // 4. Atualizar progresso
  const newCompletedSteps = [...tutorial.completedSteps, stepId];
  const isLastStep = step.step === 10;
  const newCurrentStep = step.step;

  await db
    .update(userTutorial)
    .set({
      currentStep: newCurrentStep,
      completedSteps: newCompletedSteps,
      isCompleted: isLastStep,
      completedAt: isLastStep ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(userTutorial.userId, user.id));

  // 5. Dar recompensas
  const rewardMessages: string[] = [];
  
  if (step.reward.gold) {
    await db
      .update(users)
      .set({ gold: sql`${users.gold} + ${step.reward.gold}` })
      .where(eq(users.id, user.id));
    rewardMessages.push(`💰 **${step.reward.gold.toLocaleString()} Gold**`);
  }

  if (step.reward.gems) {
    await db
      .update(users)
      .set({ gems: sql`${users.gems} + ${step.reward.gems}` })
      .where(eq(users.id, user.id));
    rewardMessages.push(`💎 **${step.reward.gems} Gems**`);
  }

  if (step.reward.tickets) {
    await db
      .update(users)
      .set({ tickets: sql`${users.tickets} + ${step.reward.tickets}` })
      .where(eq(users.id, user.id));
    rewardMessages.push(`🎟️ **${step.reward.tickets} Tickets**`);
  }

  // Recompensa especial: personagem SSR garantido (step 10)
  if (step.reward.guaranteedCharacter) {
    // Buscar personagem SSR aleatório
    const ssrCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.rarity, "SSR"))
      .limit(100);

    if (ssrCharacters.length > 0) {
      const randomChar = ssrCharacters[Math.floor(Math.random() * ssrCharacters.length)];
      
      // Dar personagem ao usuário
      await db.insert(userCharacters).values({
        userId: user.id,
        characterId: randomChar.id,
        level: 1,
      });

      rewardMessages.push(`✨ **${randomChar.name}** (${randomChar.rarity}) - ${randomChar.anime}`);
    }
  }

  // 6. Próximo step
  const nextStepData = isLastStep ? null : TUTORIAL_STEPS.find((s) => s.step === newCurrentStep + 1) || null;

  return {
    success: true,
    message: isLastStep
      ? "🎉 **Parabéns! Tutorial Completo!** Você está pronto para dominar o Anime RPG!"
      : `✅ Step ${step.step} completo!`,
    reward: {
      messages: rewardMessages,
      step: step,
    },
    nextStep: nextStepData,
  };
}

export async function skipTutorial(discordId: string): Promise<{ success: boolean; message: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (!user) {
    return { success: false, message: "❌ Usuário não encontrado." };
  }

  const [tutorial] = await db
    .select()
    .from(userTutorial)
    .where(eq(userTutorial.userId, user.id))
    .limit(1);

  if (tutorial?.isCompleted) {
    return { success: false, message: "✅ Você já completou o tutorial!" };
  }

  if (tutorial?.skipped) {
    return { success: false, message: "⏭️ Você já pulou o tutorial." };
  }

  // Atualizar para skipped
  if (tutorial) {
    await db
      .update(userTutorial)
      .set({
        skipped: true,
        updatedAt: new Date(),
      })
      .where(eq(userTutorial.userId, user.id));
  } else {
    await db.insert(userTutorial).values({
      userId: user.id,
      currentStep: 0,
      completedSteps: [],
      isCompleted: false,
      skipped: true,
      rewardsClaimed: {},
    });
  }

  return {
    success: true,
    message: "⏭️ Tutorial pulado. Você pode retomar depois com `/tutorial continuar`.",
  };
}

export async function checkStepCompletion(discordId: string, stepId: string): Promise<boolean> {
  const progress = await getTutorialProgress(discordId);
  if (!progress) return false;

  const step = TUTORIAL_STEPS.find((s) => s.id === stepId);
  if (!step) return false;

  // Se já completou ou pulou, retornar false (não exibir dicas)
  if (progress.isCompleted || progress.skipped) return false;

  // Verificar se é o próximo step esperado
  return step.step === progress.currentStep + 1;
}

export function getStepByCommand(command: string): TutorialStep | null {
  return TUTORIAL_STEPS.find((s) => s.command === command) || null;
}
