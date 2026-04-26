export const zh = {
  app: { title: 'RLabel 图像标注工具' },
  tools: {
    select: '选择', rectangle: '矩形框', polygon: '多边形', brush: '画笔', eraser: '橡皮擦',
    pan: '平移', zoom: '缩放', undo: '撤销', redo: '重做', delete: '删除',
    zoomIn: '放大', zoomOut: '缩小', resetView: '重置视图',
    point: '点', line: '线段', linestrip: '折线', circle: '圆形',
    rotatedRect: '旋转矩形', cuboid: '3D长方体', quadrilateral: '四边形', text: '文本',
    sam: 'AI分割', aiRect: 'AI检测', aiPolygon: 'AI多边形',
  },
  shortcuts: {
    V: '选择工具', R: '矩形框', P: '多边形', O: '点工具', L: '线段', C: '圆形',
    E: '旋转矩形', D: '3D长方体', Q: '四边形', T: '文本', H: '平移工具',
    A: 'AI分割', Delete: '删除选中', CtrlZ: '撤销', CtrlY: '重做', Escape: '取消',
  },
  sidebar: {
    properties: '属性', annotations: '标注列表', selectAnnotation: '选择标注',
    toViewProperties: '查看属性', noAnnotations: '暂无标注', useToolsToStart: '使用工具开始标注', items: '项',
  },
  topNav: {
    openImage: '打开图像', openFolder: '打开文件夹', previousImage: '上一张',
    nextImage: '下一张', save: '保存', noImageLoaded: '未加载图像', imageDimensions: '尺寸',
  },
  labels: { label: '标签', color: '颜色', coordinates: '坐标', type: '类型' },
  export: {
    title: '导出格式', yolo: 'YOLO 格式', labelme: 'Labelme 格式',
    coco: 'COCO 格式', json: 'JSON 格式',
  },
  empty: { title: '未加载图像', description: '打开图像或文件夹开始标注', openImage: '打开图像', openFolder: '打开文件夹' },
  theme: { dark: '深色模式', light: '浅色模式', toggle: '切换主题' },
  canvas: { zoom: '缩放' },
  settings: {
    title: '设置', autoSave: '自动保存', defaultFormat: '默认导出格式',
    fillOpacity: '填充透明度', language: '语言', showLabels: '显示标签', crosshair: '十字准线',
  },
  ai: {
    model: '模型', loading: '加载中...', confidence: '置信度', run: '运行', runAll: '批量推理',
    noModel: '未加载模型', selectModel: '选择模型',
  },
  video: {
    frame: '帧', totalFrames: '总帧数', fps: 'FPS', play: '播放', pause: '暂停',
    prevFrame: '上一帧', nextFrame: '下一帧', extractFrames: '提取帧',
  },
  check: { checked: '已审核', unchecked: '未审核', toggle: '切换审核状态' },
};

export const en: typeof zh = {
  app: { title: 'RLabel Image Annotation Tool' },
  tools: {
    select: 'Select', rectangle: 'Rectangle', polygon: 'Polygon', brush: 'Brush', eraser: 'Eraser',
    pan: 'Pan', zoom: 'Zoom', undo: 'Undo', redo: 'Redo', delete: 'Delete',
    zoomIn: 'Zoom In', zoomOut: 'Zoom Out', resetView: 'Reset View',
    point: 'Point', line: 'Line', linestrip: 'Line Strip', circle: 'Circle',
    rotatedRect: 'Rotated Rect', cuboid: '3D Cuboid', quadrilateral: 'Quadrilateral', text: 'Text',
    sam: 'AI Segment', aiRect: 'AI Detect', aiPolygon: 'AI Polygon',
  },
  shortcuts: {
    V: 'Select Tool', R: 'Rectangle', P: 'Polygon', O: 'Point', L: 'Line', C: 'Circle',
    E: 'Rotated Rect', D: '3D Cuboid', Q: 'Quadrilateral', T: 'Text', H: 'Pan Tool',
    A: 'AI Segment', Delete: 'Delete Selected', CtrlZ: 'Undo', CtrlY: 'Redo', Escape: 'Cancel',
  },
  sidebar: {
    properties: 'Properties', annotations: 'Annotations', selectAnnotation: 'Select Annotation',
    toViewProperties: 'to view properties', noAnnotations: 'No Annotations',
    useToolsToStart: 'Use tools to start labeling', items: 'items',
  },
  topNav: {
    openImage: 'Open Image', openFolder: 'Open Folder', previousImage: 'Previous',
    nextImage: 'Next', save: 'Save', noImageLoaded: 'No image loaded', imageDimensions: 'Dimensions',
  },
  labels: { label: 'Label', color: 'Color', coordinates: 'Coordinates', type: 'Type' },
  export: {
    title: 'Export Format', yolo: 'YOLO Format', labelme: 'Labelme Format',
    coco: 'COCO Format', json: 'JSON Format',
  },
  empty: { title: 'No Image Loaded', description: 'Open an image or folder to start', openImage: 'Open Image', openFolder: 'Open Folder' },
  theme: { dark: 'Dark Mode', light: 'Light Mode', toggle: 'Toggle Theme' },
  canvas: { zoom: 'Zoom' },
  settings: {
    title: 'Settings', autoSave: 'Auto Save', defaultFormat: 'Default Export Format',
    fillOpacity: 'Fill Opacity', language: 'Language', showLabels: 'Show Labels', crosshair: 'Crosshair',
  },
  ai: {
    model: 'Model', loading: 'Loading...', confidence: 'Confidence', run: 'Run', runAll: 'Run All',
    noModel: 'No model loaded', selectModel: 'Select Model',
  },
  video: {
    frame: 'Frame', totalFrames: 'Total Frames', fps: 'FPS', play: 'Play', pause: 'Pause',
    prevFrame: 'Prev Frame', nextFrame: 'Next Frame', extractFrames: 'Extract Frames',
  },
  check: { checked: 'Checked', unchecked: 'Unchecked', toggle: 'Toggle Check Status' },
};

export const ja: typeof zh = {
  app: { title: 'RLabel 画像アノテーションツール' },
  tools: {
    select: '選択', rectangle: '矩形', polygon: 'ポリゴン', brush: 'ブラシ', eraser: '消しゴム',
    pan: 'パン', zoom: 'ズーム', undo: '元に戻す', redo: 'やり直し', delete: '削除',
    zoomIn: '拡大', zoomOut: '縮小', resetView: 'ビューをリセット',
    point: 'ポイント', line: '線分', linestrip: '折れ線', circle: '円',
    rotatedRect: '回転矩形', cuboid: '3D直方体', quadrilateral: '四角形', text: 'テキスト',
    sam: 'AIセグメント', aiRect: 'AI検出', aiPolygon: 'AIポリゴン',
  },
  shortcuts: {
    V: '選択ツール', R: '矩形', P: 'ポリゴン', O: 'ポイント', L: '線分', C: '円',
    E: '回転矩形', D: '3D直方体', Q: '四角形', T: 'テキスト', H: 'パンツール',
    A: 'AIセグメント', Delete: '選択を削除', CtrlZ: '元に戻す', CtrlY: 'やり直し', Escape: 'キャンセル',
  },
  sidebar: {
    properties: 'プロパティ', annotations: 'アノテーション一覧', selectAnnotation: 'アノテーションを選択',
    toViewProperties: 'プロパティを表示', noAnnotations: 'アノテーションなし',
    useToolsToStart: 'ツールを使用して開始', items: '件',
  },
  topNav: {
    openImage: '画像を開く', openFolder: 'フォルダを開く', previousImage: '前へ',
    nextImage: '次へ', save: '保存', noImageLoaded: '画像未読込', imageDimensions: 'サイズ',
  },
  labels: { label: 'ラベル', color: '色', coordinates: '座標', type: 'タイプ' },
  export: {
    title: 'エクスポート形式', yolo: 'YOLO形式', labelme: 'Labelme形式',
    coco: 'COCO形式', json: 'JSON形式',
  },
  empty: { title: '画像未読込', description: '画像またはフォルダを開いて開始', openImage: '画像を開く', openFolder: 'フォルダを開く' },
  theme: { dark: 'ダークモード', light: 'ライトモード', toggle: 'テーマ切替' },
  canvas: { zoom: 'ズーム' },
  settings: {
    title: '設定', autoSave: '自動保存', defaultFormat: 'デフォルトエクスポート形式',
    fillOpacity: '塗りつぶし透明度', language: '言語', showLabels: 'ラベル表示', crosshair: '十字線',
  },
  ai: {
    model: 'モデル', loading: '読み込み中...', confidence: '信頼度', run: '実行', runAll: '一括推論',
    noModel: 'モデル未読込', selectModel: 'モデルを選択',
  },
  video: {
    frame: 'フレーム', totalFrames: '総フレーム数', fps: 'FPS', play: '再生', pause: '一時停止',
    prevFrame: '前フレーム', nextFrame: '次フレーム', extractFrames: 'フレーム抽出',
  },
  check: { checked: '確認済み', unchecked: '未確認', toggle: '確認状態を切替' },
};

export const ko: typeof zh = {
  app: { title: 'RLabel 이미지 주석 도구' },
  tools: {
    select: '선택', rectangle: '사각형', polygon: '다각형', brush: '브러시', eraser: '지우개',
    pan: '이동', zoom: '확대/축소', undo: '실행 취소', redo: '다시 실행', delete: '삭제',
    zoomIn: '확대', zoomOut: '축소', resetView: '보기 초기화',
    point: '점', line: '선분', linestrip: '꺾은선', circle: '원',
    rotatedRect: '회전 사각형', cuboid: '3D 직육면체', quadrilateral: '사변형', text: '텍스트',
    sam: 'AI 분할', aiRect: 'AI 검출', aiPolygon: 'AI 다각형',
  },
  shortcuts: {
    V: '선택 도구', R: '사각형', P: '다각형', O: '점', L: '선분', C: '원',
    E: '회전 사각형', D: '3D 직육면체', Q: '사변형', T: '텍스트', H: '이동 도구',
    A: 'AI 분할', Delete: '선택 삭제', CtrlZ: '실행 취소', CtrlY: '다시 실행', Escape: '취소',
  },
  sidebar: {
    properties: '속성', annotations: '주석 목록', selectAnnotation: '주석 선택',
    toViewProperties: '속성 보기', noAnnotations: '주석 없음',
    useToolsToStart: '도구를 사용하여 시작', items: '개',
  },
  topNav: {
    openImage: '이미지 열기', openFolder: '폴더 열기', previousImage: '이전',
    nextImage: '다음', save: '저장', noImageLoaded: '이미지 없음', imageDimensions: '크기',
  },
  labels: { label: '레이블', color: '색상', coordinates: '좌표', type: '유형' },
  export: {
    title: '내보내기 형식', yolo: 'YOLO 형식', labelme: 'Labelme 형식',
    coco: 'COCO 형식', json: 'JSON 형식',
  },
  empty: { title: '이미지 없음', description: '이미지 또는 폴더를 열어 시작', openImage: '이미지 열기', openFolder: '폴더 열기' },
  theme: { dark: '다크 모드', light: '라이트 모드', toggle: '테마 전환' },
  canvas: { zoom: '확대/축소' },
  settings: {
    title: '설정', autoSave: '자동 저장', defaultFormat: '기본 내보내기 형식',
    fillOpacity: '채우기 불투명도', language: '언어', showLabels: '레이블 표시', crosshair: '십자선',
  },
  ai: {
    model: '모델', loading: '로딩 중...', confidence: '신뢰도', run: '실행', runAll: '일괄 추론',
    noModel: '모델 미로드', selectModel: '모델 선택',
  },
  video: {
    frame: '프레임', totalFrames: '총 프레임', fps: 'FPS', play: '재생', pause: '일시정지',
    prevFrame: '이전 프레임', nextFrame: '다음 프레임', extractFrames: '프레임 추출',
  },
  check: { checked: '검토 완료', unchecked: '미검토', toggle: '검토 상태 전환' },
};

export type Locale = 'zh' | 'en' | 'ja' | 'ko';
export type LocaleDict = typeof zh;
