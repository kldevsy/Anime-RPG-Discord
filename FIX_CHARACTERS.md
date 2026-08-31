# FIX: Corrigir 3 Personagens Novos

## Erros encontrados:
1. Hidan (index 35) - status "cursed" não existe, target "cursed_enemy" inválido, condition value string
2. Alucard (index 36) - status "fear" e "lifesteal" não existem
3. Choso (index 37) - target "bleeding_enemies" inválido

## Solução:
Os 3 personagens (Hidan, Alucard, Choso) já foram CRIADOS anteriormente no characters.ts.

Os erros estão nas passivas que foram editadas em passive-library.ts.

JÁ CORRIGI:
- JASHIN_RITUAL: Removi "cursed", "cursed_enemy", corrigi "30" string para 30 number
- HELLSING_IMMORTALITY: Já está correto
- BLOOD_MANIPULATION: Removi "bleeding_enemies" target inválido

PRÓXIMO PASSO: Rebuild
