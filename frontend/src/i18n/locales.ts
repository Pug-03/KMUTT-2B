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
  grades: {
    damaged: string;
    old: string;
    ripe: string;
    unripe: string;
  };
  analytics: {
    title: string;
    currentFruit: string;
    detectedGrade: string;
    totalProcessed: string;
    gradeBreakdown: string;
    noDetection: string;
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
  grades: {
    damaged: 'Damaged',
    old: 'Old',
    ripe: 'Ripe',
    unripe: 'Unripe',
  },
  analytics: {
    title: 'Analytics',
    currentFruit: 'Current Fruit Type',
    detectedGrade: 'Detected Grade',
    totalProcessed: 'Total Processed',
    gradeBreakdown: 'Grade Breakdown',
    noDetection: 'No detection yet',
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
  grades: {
    damaged: 'เสียหาย',
    old: 'เก่า/สุกเกิน',
    ripe: 'สุก',
    unripe: 'ดิบ',
  },
  analytics: {
    title: 'วิเคราะห์',
    currentFruit: 'ประเภทผลไม้ปัจจุบัน',
    detectedGrade: 'เกรดที่ตรวจพบ',
    totalProcessed: 'ประมวลผลทั้งหมด',
    gradeBreakdown: 'แยกตามเกรด',
    noDetection: 'ยังไม่มีการตรวจจับ',
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
  grades: {
    damaged: '损坏',
    old: '过熟',
    ripe: '成熟',
    unripe: '未熟',
  },
  analytics: {
    title: '分析',
    currentFruit: '当前水果类型',
    detectedGrade: '检测等级',
    totalProcessed: '总处理量',
    gradeBreakdown: '等级分布',
    noDetection: '尚未检测',
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
};

export const translations: Record<Locale, Translations> = { en, th, zh };

export const localeNames: Record<Locale, string> = {
  en: 'English',
  th: 'ไทย',
  zh: '中文',
};
