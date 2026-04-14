export type Locale = 'en' | 'th' | 'zh';

export interface Translations {
  app: {
    title: string;
    subtitle: string;
  };
  nav: {
    modelSelector: string;
    language: string;
  };
  mobileTabs: {
    scanner: string;
    analytics: string;
    controls: string;
    farms: string;
  };
  grades: {
    gradeA: string;
    gradeB: string;
    gradeC: string;
    unripe: string;
    rotten: string;
    wilted: string;
  };
  defects: {
    crack: string;
    blackSpot: string;
    bruise: string;
    spoilage: string;
    none: string;
  };
  analytics: {
    title: string;
    currentFruit: string;
    detectedGrade: string;
    totalProcessed: string;
    gradeBreakdown: string;
    noDetection: string;
    revenueEstimate: string;
    defectCause: string;
  };
  scanner: {
    title: string;
    startCamera: string;
    stopCamera: string;
    startSimulation: string;
    stopSimulation: string;
    processing: string;
    confidence: string;
    noCamera: string;
    permissionDenied: string;
    tomatoDetected: string;
    noFruitDetected: string;
    viewOnly: string;
  };
  controls: {
    title: string;
    machineStatus: string;
    connected: string;
    disconnected: string;
    connect: string;
    disconnect: string;
    conveyorSpeed: string;
    binCapacity: string;
    uptime: string;
    start: string;
    stop: string;
    resetBins: string;
    proprietaryOnly: string;
    running: string;
    stopped: string;
  };
  farms: {
    title: string;
    addFarm: string;
    farmName: string;
    location: string;
    contact: string;
    addBatch: string;
    dateFrom: string;
    dateTo: string;
    noFarms: string;
    batchHistory: string;
    setActive: string;
    activeFarm: string;
    origin: string;
  };
  weight: {
    title: string;
    perFruit: string;
    variety: string;
    custom: string;
    grams: string;
    region: string;
  };
  chatbot: {
    title: string;
    placeholder: string;
    send: string;
  };
  notifications: {
    anomalyTitle: string;
    anomalyBody: string;
    dismiss: string;
  };
  notificationLog: {
    title: string;
    searchPlaceholder: string;
    all: string;
    gradings: string;
    alerts: string;
    entries: string;
    empty: string;
    threshold: string;
  };
}

const en: Translations = {
  app: {
    title: 'AI Fruit Grading System',
    subtitle: 'Real-time fruit quality classification',
  },
  nav: {
    modelSelector: 'AI Model',
    language: 'Language',
  },
  mobileTabs: {
    scanner: 'Scanner',
    analytics: 'Analytics',
    controls: 'Controls',
    farms: 'Farms',
  },
  grades: {
    gradeA: 'Grade A',
    gradeB: 'Grade B',
    gradeC: 'Grade C',
    unripe: 'Unripe',
    rotten: 'Rotten',
    wilted: 'Wilted',
  },
  defects: {
    crack: 'Crack',
    blackSpot: 'Black Spot',
    bruise: 'Bruise',
    spoilage: 'Spoilage',
    none: 'No defect',
  },
  analytics: {
    title: 'Analytics',
    currentFruit: 'Current Fruit Type',
    detectedGrade: 'Detected Grade',
    totalProcessed: 'Total Processed',
    gradeBreakdown: 'Grade Breakdown',
    noDetection: 'No detection yet',
    revenueEstimate: 'Revenue Estimate',
    defectCause: 'Defect Cause',
  },
  scanner: {
    title: 'Scanning Hub',
    startCamera: 'Start Camera',
    stopCamera: 'Stop Camera',
    startSimulation: 'Start Simulation',
    stopSimulation: 'Stop Simulation',
    processing: 'Processing...',
    confidence: 'Confidence',
    noCamera: 'No camera detected',
    permissionDenied: 'Camera permission denied',
    tomatoDetected: 'Tomato detected',
    noFruitDetected: 'No tomato detected — point camera at a real tomato',
    viewOnly: 'View-only mode — camera disabled on mobile',
  },
  controls: {
    title: 'Machine Control',
    machineStatus: 'Machine Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    connect: 'Connect',
    disconnect: 'Disconnect',
    conveyorSpeed: 'Conveyor Speed',
    binCapacity: 'Bin Capacity',
    uptime: 'Uptime',
    start: 'Start',
    stop: 'Stop',
    resetBins: 'Reset Bins',
    proprietaryOnly: 'Controls available for proprietary hardware only',
    running: 'Running',
    stopped: 'Stopped',
  },
  farms: {
    title: 'Farm Management',
    addFarm: 'Add Farm',
    farmName: 'Farm Name',
    location: 'Location',
    contact: 'Contact',
    addBatch: 'Add Batch',
    dateFrom: 'From',
    dateTo: 'To',
    noFarms: 'No farms registered yet',
    batchHistory: 'Batch History',
    setActive: 'Set as Active',
    activeFarm: 'Active Farm',
    origin: 'Origin',
  },
  weight: {
    title: 'Fruit Weight',
    perFruit: 'per fruit',
    variety: 'Select Variety',
    custom: 'Custom',
    grams: 'g',
    region: 'Region',
  },
  chatbot: {
    title: 'AI Assistant',
    placeholder: 'Ask about markets, grades, farms...',
    send: 'Send',
  },
  notifications: {
    anomalyTitle: 'Quality Alert',
    anomalyBody: 'High {grade} rate detected: {ratio}% (threshold: {threshold}%)',
    dismiss: 'Dismiss',
  },
  notificationLog: {
    title: 'Notification Log',
    searchPlaceholder: 'Search grades, alerts...',
    all: 'All',
    gradings: 'Gradings',
    alerts: 'Alerts',
    entries: 'entries',
    empty: 'No events recorded yet',
    threshold: 'threshold',
  },
};

const th: Translations = {
  app: {
    title: 'ระบบจัดเกรดผลไม้ AI',
    subtitle: 'การจำแนกคุณภาพผลไม้แบบเรียลไทม์',
  },
  nav: {
    modelSelector: 'โมเดล AI',
    language: 'ภาษา',
  },
  mobileTabs: {
    scanner: 'สแกน',
    analytics: 'วิเคราะห์',
    controls: 'ควบคุม',
    farms: 'ฟาร์ม',
  },
  grades: {
    gradeA: 'เกรด A',
    gradeB: 'เกรด B',
    gradeC: 'เกรด C',
    unripe: 'ดิบ',
    rotten: 'เน่า',
    wilted: 'เหี่ยว',
  },
  defects: {
    crack: 'รอยแตก',
    blackSpot: 'จุดดำ',
    bruise: 'รอยช้ำ',
    spoilage: 'เน่าเสีย',
    none: 'ไม่มีข้อบกพร่อง',
  },
  analytics: {
    title: 'วิเคราะห์',
    currentFruit: 'ประเภทผลไม้ปัจจุบัน',
    detectedGrade: 'เกรดที่ตรวจพบ',
    totalProcessed: 'ประมวลผลทั้งหมด',
    gradeBreakdown: 'แยกตามเกรด',
    noDetection: 'ยังไม่มีการตรวจจับ',
    revenueEstimate: 'ประมาณการรายได้',
    defectCause: 'สาเหตุข้อบกพร่อง',
  },
  scanner: {
    title: 'ศูนย์สแกน',
    startCamera: 'เปิดกล้อง',
    stopCamera: 'ปิดกล้อง',
    startSimulation: 'เริ่มจำลอง',
    stopSimulation: 'หยุดจำลอง',
    processing: 'กำลังประมวลผล...',
    confidence: 'ความเชื่อมั่น',
    noCamera: 'ไม่พบกล้อง',
    permissionDenied: 'ไม่ได้รับอนุญาตใช้กล้อง',
    tomatoDetected: 'ตรวจพบมะเขือเทศ',
    noFruitDetected: 'ไม่พบมะเขือเทศ — หันกล้องไปที่มะเขือเทศจริง',
    viewOnly: 'โหมดดูอย่างเดียว — กล้องปิดบนมือถือ',
  },
  controls: {
    title: 'ควบคุมเครื่อง',
    machineStatus: 'สถานะเครื่อง',
    connected: 'เชื่อมต่อแล้ว',
    disconnected: 'ไม่ได้เชื่อมต่อ',
    connect: 'เชื่อมต่อ',
    disconnect: 'ตัดการเชื่อมต่อ',
    conveyorSpeed: 'ความเร็วสายพาน',
    binCapacity: 'ความจุถัง',
    uptime: 'เวลาทำงาน',
    start: 'เริ่ม',
    stop: 'หยุด',
    resetBins: 'รีเซ็ตถัง',
    proprietaryOnly: 'ควบคุมได้เฉพาะฮาร์ดแวร์ของเราเท่านั้น',
    running: 'กำลังทำงาน',
    stopped: 'หยุดทำงาน',
  },
  farms: {
    title: 'จัดการฟาร์ม',
    addFarm: 'เพิ่มฟาร์ม',
    farmName: 'ชื่อฟาร์ม',
    location: 'สถานที่',
    contact: 'ติดต่อ',
    addBatch: 'เพิ่มล็อต',
    dateFrom: 'จาก',
    dateTo: 'ถึง',
    noFarms: 'ยังไม่มีฟาร์มที่ลงทะเบียน',
    batchHistory: 'ประวัติล็อต',
    setActive: 'ตั้งเป็นฟาร์มที่ใช้งาน',
    activeFarm: 'ฟาร์มที่ใช้งาน',
    origin: 'แหล่งที่มา',
  },
  weight: {
    title: 'น้ำหนักผลไม้',
    perFruit: 'ต่อผล',
    variety: 'เลือกสายพันธุ์',
    custom: 'กำหนดเอง',
    grams: 'กรัม',
    region: 'ภูมิภาค',
  },
  chatbot: {
    title: 'ผู้ช่วย AI',
    placeholder: 'ถามเกี่ยวกับตลาด, เกรด, ฟาร์ม...',
    send: 'ส่ง',
  },
  notifications: {
    anomalyTitle: 'แจ้งเตือนคุณภาพ',
    anomalyBody: 'ตรวจพบ {grade} สูง: {ratio}% (เกณฑ์: {threshold}%)',
    dismiss: 'ปิด',
  },
  notificationLog: {
    title: 'บันทึกการแจ้งเตือน',
    searchPlaceholder: 'ค้นหาเกรด, การแจ้งเตือน...',
    all: 'ทั้งหมด',
    gradings: 'การจัดเกรด',
    alerts: 'การแจ้งเตือน',
    entries: 'รายการ',
    empty: 'ยังไม่มีเหตุการณ์บันทึก',
    threshold: 'เกณฑ์',
  },
};

const zh: Translations = {
  app: {
    title: 'AI水果分级系统',
    subtitle: '实时水果质量分类',
  },
  nav: {
    modelSelector: 'AI模型',
    language: '语言',
  },
  mobileTabs: {
    scanner: '扫描',
    analytics: '分析',
    controls: '控制',
    farms: '农场',
  },
  grades: {
    gradeA: 'A级',
    gradeB: 'B级',
    gradeC: 'C级',
    unripe: '未熟',
    rotten: '腐烂',
    wilted: '枯萎',
  },
  defects: {
    crack: '裂纹',
    blackSpot: '黑斑',
    bruise: '瘀伤',
    spoilage: '腐烂',
    none: '无缺陷',
  },
  analytics: {
    title: '分析',
    currentFruit: '当前水果类型',
    detectedGrade: '检测等级',
    totalProcessed: '总处理量',
    gradeBreakdown: '等级分布',
    noDetection: '尚未检测',
    revenueEstimate: '收入估算',
    defectCause: '缺陷原因',
  },
  scanner: {
    title: '扫描中心',
    startCamera: '启动相机',
    stopCamera: '关闭相机',
    startSimulation: '开始模拟',
    stopSimulation: '停止模拟',
    processing: '处理中...',
    confidence: '置信度',
    noCamera: '未检测到相机',
    permissionDenied: '相机权限被拒绝',
    tomatoDetected: '检测到番茄',
    noFruitDetected: '未检测到番茄 — 请将镜头对准真实番茄',
    viewOnly: '仅查看模式 — 手机上禁用相机',
  },
  controls: {
    title: '机器控制',
    machineStatus: '机器状态',
    connected: '已连接',
    disconnected: '未连接',
    connect: '连接',
    disconnect: '断开',
    conveyorSpeed: '传送带速度',
    binCapacity: '仓容量',
    uptime: '运行时间',
    start: '启动',
    stop: '停止',
    resetBins: '重置仓位',
    proprietaryOnly: '仅限专有硬件使用控制功能',
    running: '运行中',
    stopped: '已停止',
  },
  farms: {
    title: '农场管理',
    addFarm: '添加农场',
    farmName: '农场名称',
    location: '位置',
    contact: '联系方式',
    addBatch: '添加批次',
    dateFrom: '从',
    dateTo: '到',
    noFarms: '尚未注册农场',
    batchHistory: '批次历史',
    setActive: '设为活跃',
    activeFarm: '活跃农场',
    origin: '来源',
  },
  weight: {
    title: '果实重量',
    perFruit: '每颗',
    variety: '选择品种',
    custom: '自定义',
    grams: '克',
    region: '地区',
  },
  chatbot: {
    title: 'AI助手',
    placeholder: '询问市场、等级、农场...',
    send: '发送',
  },
  notifications: {
    anomalyTitle: '质量警报',
    anomalyBody: '检测到高{grade}率: {ratio}% (阈值: {threshold}%)',
    dismiss: '关闭',
  },
  notificationLog: {
    title: '通知日志',
    searchPlaceholder: '搜索等级、警报...',
    all: '全部',
    gradings: '分级',
    alerts: '警报',
    entries: '条记录',
    empty: '暂无事件记录',
    threshold: '阈值',
  },
};

export const translations: Record<Locale, Translations> = { en, th, zh };

export const localeNames: Record<Locale, string> = {
  en: 'English',
  th: 'ไทย',
  zh: '中文',
};
