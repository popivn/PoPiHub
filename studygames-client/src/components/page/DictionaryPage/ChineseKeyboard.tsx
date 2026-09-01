import { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKeyboard, faDeleteLeft } from '@fortawesome/free-solid-svg-icons';

interface ChineseKeyboardProps {
  onInsert: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  lang: 'vi' | 'en';
}

const RADICALS = [
  '一', '丨', '丶', '丿', '乙', '亅', '二', '亠', '人', '儿',
  '入', '八', '冂', '冖', '冫', '几', '凵', '刀', '力', '勹',
  '匕', '匚', '匸', '十', '卜', '卩', '厂', '厶', '又', '口',
  '囗', '土', '士', '夂', '夊', '夕', '大', '女', '子', '宀',
  '寸', '小', '尢', '尸', '屮', '山', '巛', '工', '己', '巾',
  '干', '幺', '广', '廴', '廾', '弋', '弓', '彐', '彡', '彳',
  '心', '戈', '户', '手', '支', '攴', '文', '斗', '斤', '方',
  '无', '日', '曰', '月', '木', '欠', '止', '歹', '殳', '毋',
  '比', '毛', '氏', '气', '水', '火', '爪', '父', '爻', '爿',
  '片', '牙', '牛', '犬', '玄', '玉', '瓜', '瓦', '甘', '生',
  '用', '田', '疋', '疒', '癶', '白', '皮', '皿', '目', '矛',
  '矢', '石', '示', '禸', '禾', '穴', '立', '竹', '米', '糸',
  '缶', '网', '羊', '羽', '老', '而', '耒', '耳', '聿', '肉',
  '臣', '自', '至', '臼', '舌', '舛', '舟', '艮', '色', '艸',
  '虍', '虫', '血', '行', '衣', '襾', '見', '角', '言', '谷',
  '豆', '豕', '豸', '貝', '赤', '走', '足', '身', '車', '辛',
  '辰', '辵', '邑', '酉', '釆', '里', '金', '長', '門', '阜',
  '隹', '雨', '靑', '非', '面', '革', '韋', '韭', '音', '頁',
  '風', '飛', '食', '首', '香', '馬', '骨', '高', '髟', '鬥',
  '鬯', '鬲', '鬼', '魚', '鳥', '鹵', '鹿', '麥', '麻', '黃',
  '黍', '黑', '黹', '黽', '鼎', '鼓', '鼠', '鼻', '齊', '齒',
  '龍', '龜', '龠',
];

const COMMON_CHARS = [
  '你', '好', '我', '他', '她', '们', '是', '不', '有', '没',
  '在', '到', '会', '能', '说', '看', '想', '做', '去', '来',
  '人', '大', '小', '多', '少', '上', '下', '中', '前', '后',
  '天', '地', '日', '月', '年', '时', '分', '秒', '今', '明',
  '学', '生', '老', '师', '书', '字', '语', '言', '文', '章',
  '爱', '心', '家', '国', '世', '界', '朋', '友', '名', '姓',
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '百', '千', '万', '亿', '零', '两', '个', '只', '本', '条',
];

const PINYIN_MAP: Record<string, string[]> = {
  'a': ['啊', '阿', '呵'],
  'ai': ['爱', '哀', '矮', '艾'],
  'an': ['安', '按', '暗', '岸'],
  'ang': ['昂'],
  'ao': ['奥', '凹', '傲'],
  'ba': ['八', '巴', '爸', '把'],
  'bai': ['白', '百', '拜'],
  'ban': ['班', '半', '办', '般'],
  'bang': ['帮', '邦', '榜'],
  'bao': ['包', '宝', '保', '报'],
  'bei': ['北', '被', '背', '悲'],
  'ben': ['本', '奔'],
  'beng': ['崩', '绷'],
  'bi': ['比', '必', '笔', '毕'],
  'bian': ['边', '变', '便', '编'],
  'biao': ['表', '标'],
  'bie': ['别', '憋'],
  'bin': ['宾', '滨'],
  'bing': ['病', '冰', '兵'],
  'bo': ['波', '伯', '博', '拨'],
  'bu': ['不', '部', '步', '布'],
  'ca': ['擦'],
  'cai': ['才', '菜', '财', '彩'],
  'can': ['参', '餐', '残'],
  'cang': ['仓', '藏'],
  'cao': ['草', '操'],
  'ce': ['册', '侧'],
  'cen': ['岑'],
  'ceng': ['层', '曾'],
  'cha': ['查', '茶', '差', '插'],
  'chai': ['拆', '柴'],
  'chan': ['产', '禅', '馋'],
  'chang': ['长', '场', '常', '唱'],
  'chao': ['超', '朝', '吵', '抄'],
  'che': ['车', '撤'],
  'chen': ['陈', '晨', '沉', '臣'],
  'cheng': ['成', '城', '程', '称'],
  'chi': ['吃', '迟', '池', '齿'],
  'chong': ['冲', '虫', '充'],
  'chou': ['抽', '愁', '丑'],
  'chu': ['出', '处', '初', '除'],
  'chuan': ['穿', '传', '船', '川'],
  'chuang': ['窗', '床', '创'],
  'chui': ['吹', '垂'],
  'chun': ['春', '纯'],
  'chuo': ['戳'],
  'ci': ['次', '此', '词', '刺'],
  'cong': ['从', '聪', '匆'],
  'cou': ['凑'],
  'cu': ['粗', '促'],
  'cuan': ['窜'],
  'cui': ['催', '翠'],
  'cun': ['村', '存', '寸'],
  'cuo': ['错', '措'],
  'da': ['大', '打', '达', '答'],
  'dai': ['代', '带', '待', '戴'],
  'dan': ['单', '但', '担', '蛋'],
  'dang': ['当', '党', '挡'],
  'dao': ['到', '道', '刀', '导'],
  'de': ['的', '得', '德'],
  'dei': ['得'],
  'deng': ['等', '灯', '登'],
  'di': ['地', '第', '低', '弟'],
  'dian': ['点', '电', '店', '典'],
  'diao': ['掉', '调', '钓'],
  'die': ['跌', '叠'],
  'ding': ['定', '顶', '丁'],
  'diu': ['丢'],
  'dong': ['东', '动', '懂', '冬'],
  'dou': ['都', '斗', '豆', '抖'],
  'du': ['读', '度', '独', '毒'],
  'duan': ['短', '段', '断'],
  'dui': ['对', '队'],
  'dun': ['顿', '吨', '蹲'],
  'duo': ['多', '朵', '躲'],
  'e': ['饿', '额', '恶'],
  'en': ['恩'],
  'er': ['二', '而', '耳', '儿'],
  'fa': ['发', '法', '罚', '乏'],
  'fan': ['反', '烦', '饭', '范'],
  'fang': ['方', '放', '房', '访'],
  'fei': ['非', '飞', '费', '肥'],
  'fen': ['分', '份', '粉', '奋'],
  'feng': ['风', '封', '丰', '逢'],
  'fo': ['佛'],
  'fou': ['否'],
  'fu': ['父', '夫', '服', '福'],
  'ga': ['嘎'],
  'gai': ['该', '改', '盖'],
  'gan': ['干', '感', '敢', '甘'],
  'gang': ['刚', '岗', '钢'],
  'gao': ['高', '告', '搞', '稿'],
  'ge': ['个', '哥', '歌', '格'],
  'gei': ['给'],
  'gen': ['根', '跟'],
  'geng': ['更', '耕'],
  'gong': ['工', '公', '共', '功'],
  'gou': ['够', '狗', '购', '勾'],
  'gu': ['古', '故', '顾', '骨'],
  'gua': ['挂', '瓜', '刮'],
  'guai': ['怪', '乖'],
  'guan': ['关', '观', '管', '馆'],
  'guang': ['光', '广'],
  'gui': ['贵', '规', '鬼', '归'],
  'gun': ['滚', '棍'],
  'guo': ['国', '过', '果', '锅'],
  'ha': ['哈'],
  'hai': ['海', '还', '孩', '害'],
  'han': ['汉', '寒', '韩', '含'],
  'hang': ['航', '行'],
  'hao': ['好', '号', '豪'],
  'he': ['和', '河', '喝', '合'],
  'hei': ['黑'],
  'hen': ['很', '恨', '痕'],
  'heng': ['横', '恒'],
  'hong': ['红', '洪', '宏'],
  'hou': ['后', '候', '厚', '侯'],
  'hu': ['户', '湖', '虎', '护'],
  'hua': ['话', '花', '华', '画'],
  'huai': ['坏', '怀'],
  'huan': ['欢', '还', '环', '换'],
  'huang': ['黄', '荒', '皇', '慌'],
  'hui': ['会', '回', '灰', '汇'],
  'hun': ['婚', '混', '魂'],
  'huo': ['活', '火', '或', '货'],
  'ji': ['几', '机', '鸡', '及'],
  'jia': ['家', '加', '假', '价'],
  'jian': ['见', '间', '建', '简'],
  'jiang': ['江', '将', '讲', '降'],
  'jiao': ['叫', '教', '交', '角'],
  'jie': ['接', '结', '节', '街'],
  'jin': ['进', '金', '今', '近'],
  'jing': ['京', '经', '静', '精'],
  'jiong': ['窘'],
  'jiu': ['九', '久', '酒', '旧'],
  'ju': ['句', '局', '据', '举'],
  'juan': ['卷', '捐'],
  'jue': ['觉', '决', '绝'],
  'jun': ['军', '均', '君'],
  'ka': ['卡', '咖'],
  'kai': ['开', '凯'],
  'kan': ['看', '刊', '堪'],
  'kang': ['抗', '康', '炕'],
  'kao': ['考', '靠', '烤'],
  'ke': ['可', '课', '客', '科'],
  'ken': ['肯', '啃'],
  'keng': ['坑'],
  'kong': ['空', '孔', '恐'],
  'kou': ['口', '扣'],
  'ku': ['苦', '哭', '裤', '库'],
  'kua': ['跨', '夸'],
  'kuai': ['快', '块', '筷'],
  'kuan': ['宽'],
  'kuang': ['狂', '矿', '筐'],
  'kui': ['亏', '愧'],
  'kun': ['困', '昆'],
  'kuo': ['扩', '阔'],
  'la': ['拉', '啦', '腊'],
  'lai': ['来', '赖'],
  'lan': ['蓝', '兰', '烂', '懒'],
  'lang': ['浪', '狼', '朗'],
  'lao': ['老', '劳', '落', '牢'],
  'le': ['了', '乐'],
  'lei': ['类', '雷', '累', '泪'],
  'leng': ['冷'],
  'li': ['里', '理', '力', '立'],
  'lia': ['俩'],
  'lian': ['连', '联', '脸', '练'],
  'liang': ['两', '量', '凉', '亮'],
  'liao': ['了', '料', '聊'],
  'lie': ['列', '烈', '猎'],
  'lin': ['林', '临', '邻', '淋'],
  'ling': ['零', '另', '灵', '领'],
  'liu': ['六', '留', '流', '刘'],
  'long': ['龙', '隆', '笼'],
  'lou': ['楼', '漏', '搂'],
  'lu': ['路', '陆', '录', '鹿'],
  'lv': ['绿', '旅', '律'],
  'luan': ['乱', '卵'],
  'lue': ['略'],
  'lun': ['论', '轮', '伦'],
  'luo': ['落', '罗', '螺', '骆'],
  'ma': ['妈', '马', '吗', '麻'],
  'mai': ['买', '卖', '麦', '迈'],
  'man': ['满', '慢', '曼'],
  'mang': ['忙', '盲', '茫'],
  'mao': ['猫', '毛', '冒', '帽'],
  'me': ['么'],
  'mei': ['没', '美', '妹', '梅'],
  'men': ['们', '门', '闷'],
  'meng': ['梦', '蒙', '盟'],
  'mi': ['米', '密', '迷', '蜜'],
  'mian': ['面', '免', '棉', '勉'],
  'miao': ['秒', '苗', '妙'],
  'mie': ['灭'],
  'min': ['民', '敏', '明'],
  'ming': ['明', '名', '命', '鸣'],
  'miu': ['谬'],
  'mo': ['末', '莫', '摸', '魔'],
  'mou': ['某', '谋'],
  'mu': ['母', '木', '目', '幕'],
  'na': ['那', '拿', '哪', '纳'],
  'nai': ['奶', '乃', '耐'],
  'nan': ['男', '南', '难'],
  'nang': ['囊'],
  'nao': ['脑', '闹', '恼'],
  'ne': ['呢'],
  'nei': ['内'],
  'nen': ['嫩'],
  'neng': ['能'],
  'ni': ['你', '尼', '拟', '泥'],
  'nian': ['年', '念', '粘'],
  'niang': ['娘'],
  'niao': ['鸟', '尿'],
  'nie': ['捏', '聂'],
  'nin': ['您'],
  'ning': ['宁', '凝'],
  'niu': ['牛', '纽'],
  'nong': ['农', '弄', '浓'],
  'nu': ['努', '怒', '奴'],
  'nv': ['女'],
  'nuan': ['暖'],
  'nue': ['虐'],
  'nuo': ['挪', '诺'],
  'o': ['哦'],
  'ou': ['欧', '偶', '藕'],
  'pa': ['怕', '爬', '趴'],
  'pai': ['排', '拍', '牌'],
  'pan': ['盘', '判', '盼'],
  'pang': ['旁', '胖', '庞'],
  'pao': ['跑', '炮', '泡', '抛'],
  'pei': ['配', '陪', '培', '赔'],
  'pen': ['盆', '喷'],
  'peng': ['朋', '碰', '捧', '蓬'],
  'pi': ['皮', '批', '疲', '啤'],
  'pian': ['片', '偏', '骗', '篇'],
  'piao': ['票', '飘', '漂'],
  'pie': ['撇'],
  'pin': ['品', '贫', '拼'],
  'ping': ['平', '瓶', '评', '苹'],
  'po': ['破', '婆', '迫', '坡'],
  'pou': ['剖'],
  'pu': ['普', '铺', '朴', '谱'],
  'qi': ['七', '期', '起', '气'],
  'qia': ['卡', '恰'],
  'qian': ['前', '钱', '千', '签'],
  'qiang': ['强', '枪', '墙'],
  'qiao': ['桥', '巧', '敲', '瞧'],
  'qie': ['切', '且', '茄'],
  'qin': ['亲', '琴', '勤', '秦'],
  'qing': ['请', '清', '情', '轻'],
  'qiong': ['穷', '琼'],
  'qiu': ['秋', '球', '求', '囚'],
  'qu': ['去', '取', '曲', '区'],
  'quan': ['全', '权', '圈', '犬'],
  'que': ['缺', '确', '却', '雀'],
  'qun': ['群', '裙'],
  'ran': ['然', '燃', '染'],
  'rang': ['让', '嚷', '壤'],
  'rao': ['绕', '饶'],
  're': ['热', '惹'],
  'ren': ['人', '认', '任', '仁'],
  'reng': ['仍', '扔'],
  'ri': ['日'],
  'rong': ['容', '荣', '融'],
  'rou': ['肉', '柔'],
  'ru': ['如', '入', '乳', '辱'],
  'ruan': ['软'],
  'rui': ['锐', '瑞'],
  'run': ['润'],
  'ruo': ['若', '弱'],
  'sa': ['撒', '洒'],
  'sai': ['赛', '塞'],
  'san': ['三', '散', '伞'],
  'sang': ['桑', '嗓', '丧'],
  'sao': ['扫', '嫂', '骚'],
  'se': ['色', '涩'],
  'sen': ['森'],
  'seng': ['僧'],
  'sha': ['杀', '沙', '傻', '刹'],
  'shai': ['筛', '晒'],
  'shan': ['山', '善', '闪', '扇'],
  'shang': ['上', '商', '伤', '尚'],
  'shao': ['少', '烧', '绍', '哨'],
  'she': ['社', '设', '射', '蛇'],
  'shei': ['谁'],
  'shen': ['什', '身', '深', '神'],
  'sheng': ['生', '声', '升', '胜'],
  'shi': ['是', '时', '十', '事'],
  'shou': ['手', '收', '受', '寿'],
  'shu': ['书', '树', '数', '属'],
  'shua': ['刷', '耍'],
  'shuai': ['帅', '摔', '甩'],
  'shuan': ['栓', '拴'],
  'shuang': ['双', '爽'],
  'shui': ['水', '谁', '睡', '税'],
  'shun': ['顺', '瞬'],
  'shuo': ['说', '硕', '烁'],
  'si': ['四', '死', '思', '私'],
  'song': ['送', '松', '宋'],
  'sou': ['搜', '艘'],
  'su': ['素', '速', '宿', '苏'],
  'suan': ['算', '酸', '蒜'],
  'sui': ['岁', '虽', '碎', '随'],
  'sun': ['孙', '损', '笋'],
  'suo': ['所', '锁', '缩'],
  'ta': ['他', '她', '它', '塔'],
  'tai': ['太', '台', '态', '抬'],
  'tan': ['谈', '弹', '贪', '滩'],
  'tang': ['堂', '糖', '躺', '汤'],
  'tao': ['套', '逃', '桃', '讨'],
  'te': ['特'],
  'teng': ['疼', '藤'],
  'ti': ['提', '体', '题', '替'],
  'tian': ['天', '田', '甜', '添'],
  'tiao': ['条', '跳', '调', '挑'],
  'tie': ['铁', '贴'],
  'ting': ['听', '停', '厅', '庭'],
  'tong': ['同', '通', '痛', '童'],
  'tou': ['头', '投', '透', '偷'],
  'tu': ['图', '土', '吐', '突'],
  'tuan': ['团', '团'],
  'tui': ['推', '腿', '退'],
  'tun': ['吞', '屯'],
  'tuo': ['脱', '拖', '托'],
  'wa': ['娃', '挖', '瓦', '蛙'],
  'wai': ['外', '歪'],
  'wan': ['完', '晚', '万', '弯'],
  'wang': ['王', '往', '忘', '望'],
  'wei': ['为', '位', '未', '卫'],
  'wen': ['问', '文', '温', '闻'],
  'weng': ['翁', '嗡'],
  'wo': ['我', '握', '窝'],
  'wu': ['五', '无', '物', '午'],
  'xi': ['西', '喜', '希', '息'],
  'xia': ['下', '夏', '吓', '虾'],
  'xian': ['现', '先', '线', '险'],
  'xiang': ['想', '向', '相', '象'],
  'xiao': ['小', '笑', '校', '晓'],
  'xie': ['写', '些', '谢', '鞋'],
  'xin': ['新', '心', '信', '辛'],
  'xing': ['行', '星', '兴', '姓'],
  'xiong': ['兄', '熊', '凶', '胸'],
  'xiu': ['修', '秀', '休', '袖'],
  'xu': ['许', '需', '续', '虚'],
  'xuan': ['选', '宣', '悬', '旋'],
  'xue': ['学', '雪', '血', '穴'],
  'xun': ['寻', '训', '迅', '旬'],
  'ya': ['牙', '鸭', '压', '呀'],
  'yan': ['眼', '言', '颜', '烟'],
  'yang': ['样', '阳', '羊', '央'],
  'yao': ['要', '药', '邀', '遥'],
  'ye': ['也', '页', '野', '夜'],
  'yi': ['一', '以', '已', '意'],
  'yin': ['因', '音', '银', '引'],
  'ying': ['应', '英', '迎', '影'],
  'yo': ['哟'],
  'yong': ['用', '永', '勇', '拥'],
  'you': ['有', '又', '友', '右'],
  'yu': ['于', '鱼', '雨', '语'],
  'yuan': ['元', '原', '远', '院'],
  'yue': ['月', '约', '越', '跃'],
  'yun': ['运', '云', '韵', '允'],
  'za': ['杂', '砸'],
  'zai': ['在', '再', '载', '灾'],
  'zan': ['咱', '赞', '暂'],
  'zang': ['脏', '藏'],
  'zao': ['早', '造', '糟', '藻'],
  'ze': ['则', '责', '泽'],
  'zei': ['贼'],
  'zen': ['怎'],
  'zeng': ['增', '赠'],
  'zha': ['炸', '扎', '闸'],
  'zhai': ['宅', '窄', '摘'],
  'zhan': ['站', '战', '展', '占'],
  'zhang': ['张', '长', '帐', '涨'],
  'zhao': ['找', '照', '招', '着'],
  'zhe': ['这', '着', '者', '浙'],
  'zhen': ['真', '阵', '镇', '珍'],
  'zheng': ['正', '整', '证', '政'],
  'zhi': ['只', '知', '直', '制'],
  'zhong': ['中', '种', '重', '众'],
  'zhou': ['周', '州', '宙', '粥'],
  'zhu': ['主', '住', '助', '竹'],
  'zhua': ['抓'],
  'zhuai': ['拽'],
  'zhuan': ['转', '专', '赚'],
  'zhuang': ['装', '壮', '状', '撞'],
  'zhui': ['追', '坠'],
  'zhun': ['准'],
  'zhuo': ['桌', '捉', '浊'],
  'zi': ['子', '字', '自', '资'],
  'zong': ['总', '宗', '纵'],
  'zou': ['走', '奏', '邹'],
  'zu': ['组', '足', '族', '阻'],
  'zuan': ['钻'],
  'zui': ['最', '嘴', '罪'],
  'zun': ['尊', '遵'],
  'zuo': ['做', '作', '左', '坐'],
};

type Tab = 'pinyin' | 'radicals' | 'common';

export default function ChineseKeyboard({ onInsert, onBackspace, onClear, lang }: ChineseKeyboardProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('pinyin');
  const [pinyinInput, setPinyinInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const pinyinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookupPinyin = useCallback((input: string) => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    // Try exact match first
    const exact = PINYIN_MAP[trimmed];
    if (exact) {
      setSuggestions(exact);
      return;
    }

    // Try prefix matches
    const matches: string[] = [];
    for (const [key, chars] of Object.entries(PINYIN_MAP)) {
      if (key.startsWith(trimmed) || trimmed.startsWith(key)) {
        matches.push(...chars);
      }
    }
    setSuggestions(matches.length > 0 ? matches.slice(0, 12) : []);
  }, []);

  useEffect(() => {
    if (pinyinTimerRef.current) clearTimeout(pinyinTimerRef.current);
    pinyinTimerRef.current = setTimeout(() => lookupPinyin(pinyinInput), 150);
    return () => {
      if (pinyinTimerRef.current) clearTimeout(pinyinTimerRef.current);
    };
  }, [pinyinInput, lookupPinyin]);

  const handlePinyinKey = (key: string) => {
    if (key === 'backspace') {
      setPinyinInput((prev) => prev.slice(0, -1));
    } else if (key === 'space') {
      setPinyinInput((prev) => prev + ' ');
    } else if (key === 'clear') {
      setPinyinInput('');
      setSuggestions([]);
    } else {
      setPinyinInput((prev) => prev + key);
    }
  };

  const handleSuggestionClick = (char: string) => {
    onInsert(char);
    setPinyinInput('');
    setSuggestions([]);
  };

  const PINYIN_KEYS = [
    'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
    'z', 'x', 'c', 'v', 'b', 'n', 'm',
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
          open
            ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 shadow-lg shadow-teal-500/30'
            : 'bg-slate-900/90 border border-teal-500/40 text-teal-300 hover:border-teal-400 hover:bg-slate-800'
        }`}
      >
        <FontAwesomeIcon icon={faKeyboard} className="text-xs" />
        <span>{lang === 'en' ? 'Chinese Keyboard' : 'Bàn phím Hán'}</span>
      </button>

      {/* Keyboard panel */}
      {open && (
        <div className="mt-4 bg-slate-900/95 border border-teal-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 w-fit">
            {([
              { id: 'pinyin' as Tab, label: lang === 'en' ? 'Pinyin' : 'Pinyin' },
              { id: 'radicals' as Tab, label: lang === 'en' ? 'Radicals' : 'Bộ thủ' },
              { id: 'common' as Tab, label: lang === 'en' ? 'Common' : 'Phổ biến' },
            ]).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tab === t.id
                    ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-teal-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Pinyin tab */}
          {tab === 'pinyin' && (
            <div className="space-y-3">
              {/* Pinyin input display + suggestions */}
              <div className="flex items-center gap-2 flex-wrap min-h-[36px]">
                {pinyinInput && (
                  <span className="text-sm text-teal-400 font-bold bg-slate-950/80 px-3 py-1 rounded-lg border border-teal-500/30">
                    {pinyinInput}
                  </span>
                )}
                {suggestions.length > 0 ? (
                  suggestions.map((char, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSuggestionClick(char)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-lg font-bold text-slate-100 transition-all cursor-pointer active:scale-90"
                    >
                      {char}
                    </button>
                  ))
                ) : pinyinInput ? (
                  <span className="text-xs text-slate-500">
                    {lang === 'en' ? 'No match' : 'Không khớp'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    {lang === 'en' ? 'Type pinyin to get character suggestions' : 'Gõ pinyin để chọn chữ Hán'}
                  </span>
                )}
              </div>

              {/* QWERTY keyboard */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5 justify-center">
                  {PINYIN_KEYS.slice(0, 10).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handlePinyinKey(k)}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-teal-500/20 hover:border-teal-400/50 border border-slate-700 text-sm font-bold text-slate-200 transition-all cursor-pointer active:scale-90"
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 justify-center">
                  {PINYIN_KEYS.slice(10, 19).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handlePinyinKey(k)}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-teal-500/20 hover:border-teal-400/50 border border-slate-700 text-sm font-bold text-slate-200 transition-all cursor-pointer active:scale-90"
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 justify-center">
                  {PINYIN_KEYS.slice(19).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handlePinyinKey(k)}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-teal-500/20 hover:border-teal-400/50 border border-slate-700 text-sm font-bold text-slate-200 transition-all cursor-pointer active:scale-90"
                    >
                      {k}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handlePinyinKey('backspace')}
                    className="w-12 h-8 sm:w-14 sm:h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:border-rose-400/50 border border-slate-700 text-sm text-slate-200 transition-all cursor-pointer active:scale-90"
                  >
                    <FontAwesomeIcon icon={faDeleteLeft} className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Radicals tab */}
          {tab === 'radicals' && (
            <div className="max-h-64 overflow-y-auto">
              <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5">
                {RADICALS.map((char, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onInsert(char)}
                    className="aspect-square flex items-center justify-center rounded-lg bg-slate-800 hover:bg-teal-500 hover:text-slate-950 border border-slate-700 text-base font-bold text-slate-100 transition-all cursor-pointer active:scale-90"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Common characters tab */}
          {tab === 'common' && (
            <div className="max-h-64 overflow-y-auto">
              <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5">
                {COMMON_CHARS.map((char, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onInsert(char)}
                    className="aspect-square flex items-center justify-center rounded-lg bg-slate-800 hover:bg-teal-500 hover:text-slate-950 border border-slate-700 text-base font-bold text-slate-100 transition-all cursor-pointer active:scale-90"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom action bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onBackspace}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:border-rose-400/50 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <FontAwesomeIcon icon={faDeleteLeft} className="text-xs" />
              <span>{lang === 'en' ? 'Delete' : 'Xoá 1 ký tự'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClear();
                setPinyinInput('');
                setSuggestions([]);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:border-rose-400/50 border border-slate-700 text-xs font-semibold text-rose-400 transition-all cursor-pointer"
            >
              {lang === 'en' ? 'Clear all' : 'Xoá tất cả'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
