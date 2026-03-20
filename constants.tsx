
import { CharacterType, CharacterData, EventCard } from './types';

export const CHARACTERS: Record<CharacterType, CharacterData> = {
  [CharacterType.Knd]: {
    id: CharacterType.Knd,
    name: 'Knd',
    displayName: '宵崎 奏 (Kanade)',
    avatar: '🎹',
    color: '#a8b4c0',
    positiveBuff: '奏响的音色：当 25h 任意角色首次登上「终端舞台」时，奏获得一满「电池」。',
    negativeBuff: '脆く：若在同一回合内，奏进行角色移动且使用技能，则下回合不能进行角色移动。',
    skill: '点燃决心：消耗 3 电池。选择任意一名角色，向前/后移动 1 格。',
    cost: '3 电池'
  },
  [CharacterType.Mfy]: {
    id: CharacterType.Mfy,
    name: 'Mfy',
    displayName: '朝比奈 真冬 (Mafuyu)',
    avatar: '❄️',
    color: '#828ccb',
    positiveBuff: '決意の帰路：当真冬解除「舞台混乱」后，可选择任一可见真冬，使其前进一格。',
    negativeBuff: 'BUG：当真冬停留在「终端舞台」时，不会获得「电池」。',
    skill: '牵起迷路之人的手：消耗 2 电池。当真冬陷入「舞台混乱」时，若最上方塔上有其他可见真冬，则可解除混乱状态，移动至该「巡演塔」最上方。',
    cost: '2 电池'
  },
  [CharacterType.Ena]: {
    id: CharacterType.Ena,
    name: 'Ena',
    displayName: '东云 绘名 (Ena)',
    avatar: '🎨',
    color: '#c19a82',
    positiveBuff: '独步莫若同行：当绘名与至少一名其他角色位于同一「巡演塔」上时，在回合结束可将一空「电池」充满。',
    negativeBuff: '无法填满的淡色：当绘名陷入「舞台混乱」后，需要额外消耗一满「电池」才能被解救。若无多余满「电池」，则需要等待「电池」充满。',
    skill: '其绘名为：消耗 X 电池。选择任意一座「巡演塔」，使其前进 x 格。',
    cost: 'X 电池'
  },
  [CharacterType.Mzk]: {
    id: CharacterType.Mzk,
    name: 'Mzk',
    displayName: '晓山 瑞希 (Mizuki)',
    avatar: '🎀',
    color: '#e29ab6',
    positiveBuff: 'IDSMILE：当瑞希成功解救陷入「舞台混乱」的角色后，增加一次行动次数。',
    negativeBuff: '孤独的乌托邦：若可见瑞希与其他 2 名及以上角色位于同一位置时，不可使用技能。',
    skill: '我们的生存出逃：消耗 2 电池。选择任意一座「巡演塔」，解救出一名陷入「舞台混乱」的角色，并使其前进 1 格。',
    cost: '2 电池'
  },
  [CharacterType.Miku]: {
    id: CharacterType.Miku,
    name: 'Miku',
    displayName: '初音 未来 (Miku)',
    avatar: '🎤',
    color: '#9de6da',
    positiveBuff: '此心同寄：当 Miku 与其使用技能的角色位于同一格时，技能消耗的电池数减一。',
    negativeBuff: '被切断的线：存在 Miku 独自位于「巡演塔」上时，本回合不能使用技能。',
    skill: '在心愿重合的地方：选择任意在场角色，复制并使用其技能，技能效果与消耗电池数量与其他角色保持一致。',
    cost: '等同目标'
  },
  [CharacterType.Kaito]: {
    id: CharacterType.Kaito,
    name: 'Kaito',
    displayName: 'KAITO',
    avatar: '🧣',
    color: '#82b0e2',
    positiveBuff: '最棒的舞台：当 Kaito 位于「巡演塔」最上方时，该「巡演塔」本回合不会受到事件卡影响。',
    negativeBuff: '凋落的花朵：Kaito 使用技能后，本回合不能再进行移动。',
    skill: '引导之手：消耗 2 电池. 选择任意两名角色，将其中一人移动至另一人所在位置（不可两名角色都选择自己）。',
    cost: '2 电池'
  }
};

export const INITIAL_EVENTS: EventCard[] = [
  // 18 Basic Events
  { id: 'e1', title: '站位！站位！', description: '选择任意一名角色，与其交换位置。（不可选择在「终端舞台」的角色）' },
  { id: 'e2', title: '即兴合唱！', description: '熟悉的声音，还有那跳动着的双马尾！获得神秘人帮助，获得一个满「电池」。' },
  { id: 'e3', title: '备受好评', description: '掌声和欢呼浪潮般袭来，表演大获成功！可将自己的任一可见角色向前移动 1 格。' },
  { id: 'e4', title: '完美搭建', description: '选择任意一个被覆盖的「巡演塔」，移动该塔到任一「世界回廊」上。' },
  { id: 'e5', title: '气氛逐渐火热', description: '增加一次掷骰子次数。' },
  { id: 'e6', title: '灵感大爆发', description: '下一次使用技能时，不消耗电池。' },
  { id: 'e7', title: '后台通行证', description: '抬起一座被覆盖的「巡演塔」，将自己陷入「舞台混乱」的角色移动至最上方的塔上。' },
  { id: 'e8', title: '下午茶时间', description: '本回合内，增加一次角色移动次数。' },
  { id: 'e9', title: '这个布景不太妙', description: '选择一座「巡演塔」，本回合内不能被移动。' },
  { id: 'e10', title: '摸鱼进行时', description: '本回合立刻结束。' },
  { id: 'e11', title: '麦克风啸叫', description: '音量突然失控。自己所有位于「巡演塔」上的角色，后退一格。' },
  { id: 'e12', title: '灯光事故', description: '下一次登上「终端舞台」的角色，不获得「电池」。' },
  { id: 'e13', title: '灵感枯竭中', description: '下一次使用技能时，额外消耗 2 满「电池」。' },
  { id: 'e14', title: '鸦雀无声', description: '将自己所有在「巡演塔」上的角色往后移动一格。' },
  { id: 'e15', title: '临时维修通知', description: '选择自己角色所在的一座「巡演塔」，该塔和其上的所有角色下一回合不可移动。' },
  { id: 'e16', title: '突发事故', description: '表演被迫中断，暂停行动一回合。' },
  { id: 'e17', title: '节奏被打乱', description: '本回合内，若有角色或塔进行移动，则移动格子数减一。' },
  { id: 'e18', title: '体力条见底', description: '将一满「电池」变为空「电池」。' },

  // 5 Team Events
  { id: 'te1', title: '来散散步吧', description: '当角色是 knd/mfy/ena，且与其中至少一名位于同一格时，可移动至相邻「巡演塔」；若三人同格，移至最近的「终端舞台」巡演塔。', isTeamEvent: true },
  { id: 'te2', title: '适合创作的地方', description: '当角色是 mzk/knd/mfy，若在「世界回廊」遇到另外两人，充满一个空「电池」；若三人都在，每人充满一个。', isTeamEvent: true },
  { id: 'te3', title: '不完成可是会被xx的', description: '若角色为 mfy，可移至 ena/mzk 所在格；若角色为 ena/mzk，使用 1「电池」行动次数加一。', isTeamEvent: true },
  { id: 'te4', title: '世界的尽头', description: '当角色是 mzk/ena/knd，若处于「世界回廊」，掷骰点数前进；若有两人及以上同格，前进点数*2。', isTeamEvent: true },
  { id: 'te5', title: '秘密庆功宴', description: '当「世界回廊」上有 25h 所有成员时，所有人掷骰子，单数前进一格，双数充满一个空「电池」。', isTeamEvent: true }
];

export const TILE_COUNT = 16;
