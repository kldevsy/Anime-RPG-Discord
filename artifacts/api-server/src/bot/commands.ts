import { SlashCommandBuilder } from "discord.js";

export const commandDefinitions = [
  // 1. /perfil
  new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Exibe o seu perfil de jogador do Anime RPG, estatísticas e recursos."),

  // 2. /invocar
  new SlashCommandBuilder()
    .setName("invocar")
    .setDescription("Invoca novos personagens de anime no sistema Gacha.")
    .addIntegerOption((opt) =>
      opt
        .setName("quantidade")
        .setDescription("Quantidade de invocações (1 ou 10)")
        .setRequired(false)
        .addChoices({ name: "1 Invocação", value: 1 }, { name: "10 Invocações", value: 10 })
    )
    .addStringOption((opt) =>
      opt
        .setName("banner")
        .setDescription("Escolha ou pesquise um banner ativo")
        .setRequired(false)
        .setAutocomplete(true)
    ),

  // 3. /banner
  new SlashCommandBuilder()
    .setName("banner")
    .setDescription("Lista os banners de invocação ativos com taxas e custos."),

  // 4. /personagens
  new SlashCommandBuilder()
    .setName("personagens")
    .setDescription("Lista a sua coleção ou o catálogo de personagens disponíveis.")
    .addStringOption((opt) =>
      opt.setName("anime").setDescription("Filtrar por nome do anime").setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("raridade")
        .setDescription("Filtrar por raridade")
        .setRequired(false)
        .addChoices(
          { name: "Comum", value: "common" },
          { name: "Incomum", value: "uncommon" },
          { name: "Raro", value: "rare" },
          { name: "Épico", value: "epic" },
          { name: "Lendário", value: "legendary" },
          { name: "Mítico", value: "mythic" }
        )
    ),

  // 5. /personagem
  new SlashCommandBuilder()
    .setName("personagem")
    .setDescription("Exibe detalhes completos de um personagem específico.")
    .addStringOption((opt) =>
      opt.setName("nome").setDescription("Nome ou ID do personagem").setRequired(true)
    ),

  // 6. /equipe
  new SlashCommandBuilder()
    .setName("equipe")
    .setDescription("Gerencia a sua equipe principal de combate (até 5 personagens).")
    .addSubcommand((sub) => sub.setName("ver").setDescription("Exibe a sua equipe atual."))
    .addSubcommand((sub) =>
      sub
        .setName("adicionar")
        .setDescription("Adiciona um personagem possuído à equipe.")
        .addStringOption((opt) =>
          opt
            .setName("personagem_id")
            .setDescription("Selecione um personagem possuído fora da equipe")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remover")
        .setDescription("Remove um personagem possuído da equipe.")
        .addStringOption((opt) =>
          opt
            .setName("personagem_id")
            .setDescription("Selecione um personagem possuído na equipe")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("ordenar")
        .setDescription("Define a ordem completa da equipe (use /equipe ver e IDs separados por vírgula).")
        .addStringOption((opt) =>
          opt
            .setName("ids")
            .setDescription("IDs possuídos na ordem, separados por vírgula (copie de /equipe ver)")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("mover")
        .setDescription("Move um membro atual para uma posição da equipe.")
        .addStringOption((opt) =>
          opt
            .setName("personagem_id")
            .setDescription("Selecione um personagem possuído na equipe")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("posicao")
            .setDescription("Nova posição na equipe (1 a 5)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5)
        )
    ),

  // 7. /batalha
  new SlashCommandBuilder()
    .setName("batalha")
    .setDescription("Inicia uma batalha automática por turnos com sua equipe principal.")
    .addStringOption((opt) =>
      opt
        .setName("estagio_id")
        .setDescription("Selecione um estágio PvE para a batalha (opcional)")
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("velocidade")
        .setDescription("Velocidade da animação da batalha (padrão: lento)")
        .setRequired(false)
        .addChoices(
          { name: "Lento", value: "slow" },
          { name: "Médio", value: "medium" },
          { name: "Rápido", value: "fast" }
        )
    ),

  // 8. /missoes
  new SlashCommandBuilder()
    .setName("missoes")
    .setDescription("Visualiza e resgata recompensas de missões diárias, semanais e de história.")
    .addStringOption((opt) =>
      opt
        .setName("categoria")
        .setDescription("Categoria de missão")
        .setRequired(false)
        .addChoices(
          { name: "Diárias", value: "daily" },
          { name: "Semanais", value: "weekly" },
          { name: "História", value: "story" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("acao")
        .setDescription("Ação a realizar")
        .setRequired(false)
        .addChoices({ name: "Ver Missões", value: "ver" }, { name: "Resgatar Recompensa", value: "resgatar" })
    )
    .addStringOption((opt) =>
      opt.setName("id").setDescription("ID da missão para resgate").setRequired(false)
    ),

  // 9. /inventario
  new SlashCommandBuilder()
    .setName("inventario")
    .setDescription("Exibe o seu inventário de moedas e itens."),

  // 10. /diario
  new SlashCommandBuilder()
    .setName("diario")
    .setDescription("Verifica e resgata a sua recompensa diária.")
    .addStringOption((opt) =>
      opt
        .setName("acao")
        .setDescription("Ação")
        .setRequired(false)
        .addChoices({ name: "Ver Status", value: "ver" }, { name: "Resgatar Hoje", value: "resgatar" })
    ),

  // 11. /ranking
  new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Exibe a classificação global dos melhores jogadores do servidor.")
    .addStringOption((opt) =>
      opt
        .setName("categoria")
        .setDescription("Métrica do ranking")
        .setRequired(false)
        .addChoices(
          { name: "Gold (Ouro)", value: "gold" },
          { name: "Gems (Gemas)", value: "gems" },
          { name: "Tickets", value: "tickets" }
        )
    ),

  // 12. /historico
  new SlashCommandBuilder()
    .setName("historico")
    .setDescription("Exibe o histórico de invocações, transações ou batalhas.")
    .addStringOption((opt) =>
      opt
        .setName("tipo")
        .setDescription("Tipo de histórico")
        .setRequired(false)
        .addChoices(
          { name: "Invocações", value: "invocacoes" },
          { name: "Transações", value: "transacoes" },
          { name: "Batalhas", value: "batalhas" }
        )
    ),

  // 13. /meta
  new SlashCommandBuilder()
    .setName("meta")
    .setDescription("Análise META de personagens top tier por categoria com detalhes profissionais."),

  // 14. /arena
  new SlashCommandBuilder()
    .setName("arena")
    .setDescription("Batalhe contra times aleatórios adaptativos que escalam com seu progresso!")
    .addStringOption((opt) =>
      opt
        .setName("dificuldade")
        .setDescription("Escolha a dificuldade da batalha")
        .setRequired(false)
        .addChoices(
          { name: "🟢 Fácil - Treino básico", value: "easy" },
          { name: "🟡 Normal - Desafio equilibrado", value: "normal" },
          { name: "🔴 Difícil - Para veteranos", value: "hard" },
          { name: "⚫ Pesadelo - Apenas os melhores", value: "nightmare" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("velocidade")
        .setDescription("Velocidade da animação da batalha")
        .setRequired(false)
        .addChoices(
          { name: "Lento", value: "slow" },
          { name: "Médio", value: "medium" },
          { name: "Rápido", value: "fast" }
        )
    ),

  // 15. /equipamento
  new SlashCommandBuilder()
    .setName("equipamento")
    .setDescription("Gerencia equipamentos dos seus personagens (stats e passiva adicional).")
    .addSubcommand((sub) =>
      sub
        .setName("equipar")
        .setDescription("Equipa um item em um personagem da sua coleção")
        .addStringOption((opt) =>
          opt
            .setName("personagem")
            .setDescription("Selecione o personagem")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("equipamento")
            .setDescription("Selecione o equipamento do seu inventário")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remover")
        .setDescription("Remove o equipamento de um personagem")
        .addStringOption((opt) =>
          opt
            .setName("personagem")
            .setDescription("Selecione o personagem")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("inventario")
        .setDescription("Lista todos os equipamentos do seu inventário")
        .addStringOption((opt) =>
          opt
            .setName("filtro")
            .setDescription("Filtrar equipamentos")
            .setRequired(false)
            .addChoices(
              { name: "Todos", value: "all" },
              { name: "Equipados", value: "equipped" },
              { name: "Disponíveis", value: "available" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("catalogo")
        .setDescription("Ver catálogo completo de equipamentos do jogo")
        .addStringOption((opt) =>
          opt
            .setName("tipo")
            .setDescription("Filtrar por tipo equipável")
            .setRequired(false)
            .addChoices(
              { name: "Todos", value: "all" },
              { name: "Personagem Específico", value: "character" },
              { name: "Classe (DPS/Tank/etc)", value: "role" },
              { name: "Universal", value: "universal" }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName("raridade")
            .setDescription("Filtrar por raridade")
            .setRequired(false)
            .addChoices(
              { name: "Comum", value: "common" },
              { name: "Incomum", value: "uncommon" },
              { name: "Raro", value: "rare" },
              { name: "Épico", value: "epic" },
              { name: "Lendário", value: "legendary" },
              { name: "Mítico", value: "mythic" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("info")
        .setDescription("Ver detalhes completos de um equipamento")
        .addStringOption((opt) =>
          opt
            .setName("nome")
            .setDescription("Nome do equipamento")
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  // 16. /admin
  new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Comandos administrativos para gerenciamento do RPG.")
    .addSubcommand((sub) =>
      sub
        .setName("character")
        .setDescription("Criar novo personagem no catálogo")
        .addStringOption((o) => o.setName("anime").setDescription("Anime").setRequired(true))
        .addStringOption((o) => o.setName("nome").setDescription("Nome do personagem").setRequired(true))
        .addStringOption((o) =>
          o
            .setName("raridade")
            .setDescription("Raridade")
            .setRequired(true)
            .addChoices(
              { name: "Comum", value: "common" },
              { name: "Incomum", value: "uncommon" },
              { name: "Raro", value: "rare" },
              { name: "Épico", value: "epic" },
              { name: "Lendário", value: "legendary" },
              { name: "Mítico", value: "mythic" }
            )
        )
        .addStringOption((o) =>
          o
            .setName("funcao")
            .setDescription("Função de combate")
            .setRequired(true)
            .addChoices(
              { name: "DPS", value: "dps" },
              { name: "Tank", value: "tank" },
              { name: "Healer", value: "healer" },
              { name: "Suporte", value: "support" },
              { name: "Controle", value: "control" }
            )
        )
        .addIntegerOption((o) => o.setName("hp").setDescription("Base HP").setRequired(true))
        .addIntegerOption((o) => o.setName("ataque").setDescription("Base Ataque").setRequired(true))
        .addIntegerOption((o) => o.setName("defesa").setDescription("Base Defesa").setRequired(true))
        .addIntegerOption((o) => o.setName("velocidade").setDescription("Base Velocidade").setRequired(true))
        .addStringOption((o) => o.setName("passiva").setDescription("Nome da passiva").setRequired(false))
        .addStringOption((o) => o.setName("imagem_url").setDescription("URL HTTP(S) da imagem do personagem").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("banner")
        .setDescription("Criar novo banner de gacha")
        .addStringOption((o) => o.setName("nome").setDescription("Nome do banner").setRequired(true))
        .addStringOption((o) =>
          o
            .setName("tipo")
            .setDescription("Tipo do banner")
            .setRequired(true)
            .addChoices(
              { name: "Normal", value: "normal" },
              { name: "Limitado", value: "limited" },
              { name: "Evento", value: "event" }
            )
        )
        .addStringOption((o) =>
          o
            .setName("moeda")
            .setDescription("Moeda do banner")
            .setRequired(true)
            .addChoices(
              { name: "Tickets", value: "tickets" },
              { name: "Gems", value: "gems" },
              { name: "Gold", value: "gold" }
            )
        )
        .addIntegerOption((o) => o.setName("custo_unico").setDescription("Custo de 1 invocação").setRequired(true))
        .addIntegerOption((o) => o.setName("custo_dez").setDescription("Custo de 10 invocações").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("event")
        .setDescription("Criar novo evento de chefe")
        .addStringOption((o) => o.setName("nome").setDescription("Nome do evento").setRequired(true))
        .addStringOption((o) => o.setName("descricao").setDescription("Descrição").setRequired(true))
        .addStringOption((o) => o.setName("inimigo_nome").setDescription("Nome do Inimigo").setRequired(true))
        .addIntegerOption((o) => o.setName("inimigo_hp").setDescription("HP do Inimigo").setRequired(true))
        .addIntegerOption((o) => o.setName("inimigo_ataque").setDescription("Ataque do Inimigo").setRequired(true))
        .addIntegerOption((o) => o.setName("inimigo_defesa").setDescription("Defesa do Inimigo").setRequired(true))
        .addIntegerOption((o) => o.setName("inimigo_velocidade").setDescription("Velocidade").setRequired(true))
        .addIntegerOption((o) => o.setName("recompensa_gems").setDescription("Gemas de recompensa").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("give")
        .setDescription("Conceder moedas ou personagens a um jogador")
        .addStringOption((o) => o.setName("usuario").setDescription("ID Discord do jogador").setRequired(true))
        .addIntegerOption((o) => o.setName("gold").setDescription("Quantidade de Gold").setRequired(false))
        .addIntegerOption((o) => o.setName("gems").setDescription("Quantidade de Gemas").setRequired(false))
        .addIntegerOption((o) => o.setName("tickets").setDescription("Quantidade de Tickets").setRequired(false))
        .addStringOption((o) => o.setName("personagem_id").setDescription("ID do personagem no catálogo").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remover moedas ou personagens de um jogador")
        .addStringOption((o) => o.setName("usuario").setDescription("ID Discord do jogador").setRequired(true))
        .addIntegerOption((o) => o.setName("gold").setDescription("Quantidade de Gold").setRequired(false))
        .addIntegerOption((o) => o.setName("gems").setDescription("Quantidade de Gemas").setRequired(false))
        .addIntegerOption((o) => o.setName("tickets").setDescription("Quantidade de Tickets").setRequired(false))
        .addStringOption((o) => o.setName("personagem_id").setDescription("ID do personagem possuído").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("battle")
        .setDescription("Limpar ou destravar batalhas pendentes do jogador")
        .addStringOption((o) => o.setName("usuario").setDescription("ID Discord do jogador").setRequired(true))
    ),
];
