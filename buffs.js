// Defines all possible buffs that shrines can grant.
export const BUFF_TYPES = {
    SPEED: 'speed',
    ATTACK_SPEED: 'attack_speed',
    DAMAGE_SHIELD: 'damage_shield',
};

export const BUFFS = {
    [BUFF_TYPES.SPEED]: {
        id: BUFF_TYPES.SPEED,
        name: 'Haste',
        icon: '👟',
        description: 'Movement speed greatly increased for 15 seconds.',
        duration: 15,
        potency: 1.8,
        effects: { speed: 1.8 }
    },
    [BUFF_TYPES.ATTACK_SPEED]: {
        id: BUFF_TYPES.ATTACK_SPEED,
        name: 'Frenzy',
        icon: '⚔️',
        description: 'Attack speed greatly increased for 15 seconds.',
        duration: 15,
        potency: 0.5,
        effects: { attackSpeed: 2.0 }
    },
    [BUFF_TYPES.DAMAGE_SHIELD]: {
        id: BUFF_TYPES.DAMAGE_SHIELD,
        name: 'Aegis',
        icon: '🛡️',
        description: 'Absorb the next source of damage.',
        duration: Infinity,
        potency: 1,
        effects: {}
    }
};
