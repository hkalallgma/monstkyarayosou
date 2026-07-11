
const LOCAL_STORAGE_KEY = 'charGeneratorDataV70';
const HISTORY_STORAGE_KEY = 'charGeneratorHistoryListV1';

const canvas = document.getElementById('statusCanvas');
const ctx = canvas.getContext('2d');
const MAX_ABILITIES = 8;
const MAX_CONNECT_SKILLS = 4;
const TRIBE_LIST = ["亜人", "聖騎士", "神", "妖精", "サムライ", "魔族", "魔王", "魔人", "コスモ", "ロボット", "ドラゴン", "獣", "ユニオン", "幻妖", "アクシス", "幻獣", "鉱物", "鳥"];

const ATTRIBUTE_MAP = {
    "火": "fire", "水": "water", "木": "wood", "光": "light", "闇": "dark", "無": "none", "全": "all"
};

// ==========================================
// CSVからの全アビリティ網羅リスト自動生成ロジック (読み仮名対応版)
// ==========================================
let ALL_ABILITIES = []; // { text: "表示名", kana: "ヨミガナ" } のオブジェクト配列になります

// CSVを読み込んでオブジェクトの配列に変換する関数
async function fetchAndParseCSV(url) {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.trim().split('\n').map(line => line.split(','));
    const keys = lines[1].map(k => k.trim()); 
    const data = [];
    
    for (let i = 2; i < lines.length; i++) {
        const row = lines[i];
        if (row.length === 0 || row[0] === "") continue; 
        
        const obj = {};
        keys.forEach((key, index) => {
            let val = row[index] ? row[index].trim() : "";
            if (val.toUpperCase() === 'T' || val.toUpperCase() === 'TRUE') val = true;
            else if (val === '' || val.toUpperCase() === 'FALSE') val = false;
            obj[key] = val;
        });
        data.push(obj);
    }
    return data;
}

// データベースを初期化し、全パターンのアビリティを生成する関数
async function initializeAbilitiesDatabase() {
    try {
        const [abilitiesTable, gradesTable, killersTable, sealsTable, resistsTable] = await Promise.all([
            fetchAndParseCSV('アビリティ.csv'),
            fetchAndParseCSV('等級.csv'),
            fetchAndParseCSV('キラー.csv'),
            fetchAndParseCSV('封じ.csv'),
            fetchAndParseCSV('耐性.csv')
        ]);

        const abilityMap = new Map(); // 重複防止用にMapを使用 (key: 表示名, value: ヨミガナ)
        const grades = gradesTable.map(g => g.name ? g.name : "");

        // 1. アビリティの展開 (name列とnameK列を使用)
        abilitiesTable.forEach(item => {
            // 超がついた場合、ヨミガナには「チョウ」をつける
            const prefixes = item.hasChou ? [{t: "", k: ""}, {t: "超", k: "チョウ"}] : [{t: "", k: ""}];
            const gradeSuffixes = item.hasGrade ? grades : [""];

            prefixes.forEach(prefix => {
                gradeSuffixes.forEach(grade => {
                    const text = `${prefix.t}${item.name}${grade}`;
                    const kana = `${prefix.k}${item.nameK || item.name}${grade}`;
                    abilityMap.set(text, kana);
                });
            });
        });

        // 2. キラーの展開 (target列とtargetK列を使用)
        killersTable.forEach(item => {
            const gradeSuffixes = item.hasGrade ? grades : [""];
            gradeSuffixes.forEach(grade => {
                const text = `${item.target}キラー${grade}`;
                const kana = `${item.targetK || item.target}キラー${grade}`;
                abilityMap.set(text, kana);
            });
        });

        // 3. 封じの展開
        sealsTable.forEach(item => {
            const gradeSuffixes = item.hasGrade ? grades : [""];
            gradeSuffixes.forEach(grade => {
                const text = `${item.target}封じ${grade}`;
                const kana = `${item.targetK || item.target}フウジ${grade}`;
                abilityMap.set(text, kana);
            });
        });

        // 4. 耐性の展開
        resistsTable.forEach(item => {
            const gradeSuffixes = item.hasGrade ? grades : [""];
            gradeSuffixes.forEach(grade => {
                const text = `${item.target}耐性${grade}`;
                const kana = `${item.targetK || item.target}タイセイ${grade}`;
                abilityMap.set(text, kana);
            });
        });

        // オブジェクトの配列に変換してソートし、グローバル変数にセット
        ALL_ABILITIES = Array.from(abilityMap, ([text, kana]) => ({ text, kana }))
                             .sort((a, b) => a.text.localeCompare(b.text));
        
        console.log(`アビリティリスト生成完了(読み仮名対応): 計 ${ALL_ABILITIES.length} 件`);

    } catch (error) {
        console.error("CSVの読み込みに失敗しました。パスやファイル名を確認してください:", error);
    }
}

initializeAbilitiesDatabase();

const inputs = {
    charName: document.getElementById('charName'), tribeInput: document.getElementById('tribeInput'),
    assistSkill_nonKai: document.getElementById('assistSkill_nonKai'), shotSkill_nonKai: document.getElementById('shotSkill_nonKai'),
    strikeShotText: document.getElementById('strikeShotText'), ssTurn1: document.getElementById('ssTurn1'), ssTurn2: document.getElementById('ssTurn2'),
    mainComboText: document.getElementById('mainComboText'), subComboText: document.getElementById('subComboText'),
    connectSkillCondition: document.getElementById('connectSkillCondition'), 
    charImageX: document.getElementById('charImageX'), charImageY: document.getElementById('charImageY'),
    charImageWidth: document.getElementById('charImageWidth'), charImageHeight: document.getElementById('charImageHeight'),
    mainComboImageX: document.getElementById('mainComboImageX'), mainComboImageY: document.getElementById('mainComboImageY'),
    mainComboImageY_jyu: document.getElementById('mainComboImageY_jyu'), mainComboWidth: document.getElementById('mainComboWidth'),
    mainComboHeight: document.getElementById('mainComboHeight'), subComboImageX: document.getElementById('subComboImageX'),
    subComboImageY: document.getElementById('subComboImageY'), subComboImageY_jyu: document.getElementById('subComboImageY_jyu'),
    subComboWidth: document.getElementById('subComboWidth'), subComboHeight: document.getElementById('subComboHeight'),
    ssY_shinKai: document.getElementById('ssY_shinKai'), mainComboY_shinKai: document.getElementById('mainComboY_shinKai'),
    subComboY_shinKai: document.getElementById('subComboY_shinKai'), ssY_jyu: document.getElementById('ssY_jyu'),
    mainComboY_jyu: document.getElementById('mainComboY_jyu'), subComboY_jyu: document.getElementById('subComboY_jyu'),
    charNameColor: document.getElementById('charNameColor'), tribeBattleColor: document.getElementById('tribeBattleColor'),
    abilityColor: document.getElementById('abilityColor'), assistShotSsDescColor: document.getElementById('assistShotSsDescColor'),
    connectSkillColor: document.getElementById('connectSkillColor'), connectConditionColor: document.getElementById('connectConditionColor'),
    ssTurnColor: document.getElementById('ssTurnColor'), comboDescColor: document.getElementById('comboDescColor'),
    abilityBoxBgColor: document.getElementById('abilityBoxBgColor'), abilityBoxBorderColor: document.getElementById('abilityBoxBorderColor'),
    ssDescColor: document.getElementById('ssDescColor'),
    separateGauge: document.getElementById('separateGauge'),
};

const attributeSelectDiv = document.getElementById('attributeSelect');
const numberSelectDiv = document.getElementById('numberSelect');
const battleTypeSelectDiv = document.getElementById('battleTypeSelect');
const shotTypeSelectDiv = document.getElementById('shotTypeSelect');
const luckSkillSelectDiv = document.getElementById('luckSkillSelect');
const abilityListDiv = document.getElementById('ability-list');
const addAbilityBtn = document.getElementById('addAbilityBtn');
const mainComboAttributeRadioGroup = document.getElementById('mainComboAttributeSelect');
const subComboAttributeRadioGroup = document.getElementById('subComboAttributeSelect');
const mainComboImageUpload = document.getElementById('mainComboImageUpload');
const subComboImageUpload = document.getElementById('subComboImageUpload');
const connectSkillControlsDiv = document.getElementById('connect-skill-controls');
const connectSkillListDiv = document.getElementById('connect-skill-list');
const addConnectSkillBtn = document.getElementById('addConnectSkillBtn');
const shotSkillLabel = document.getElementById('shotSkillLabel');
const assistSkillLabel = document.getElementById('assistSkillLabel');
const charImgSettingsDiv = document.getElementById('charImgSettings');
const resetBtn = document.getElementById('resetBtn');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');

const templateImage = new Image();
let currentBackgroundImage = null;
let currentCharImage = null;
let mainComboUserImage = null;
let subComboUserImage = null;
let abilities = []; 
let connectSkills = []; 
let isSortMode = false;
let sortOrder = [];
const ABILITY_OPTIONS = [
    "超アンチ重力バリア", "超アンチダメージウォール", "超アンチワープ", "超マインスイーパー", 
    "超アンチウィンド", "超アンチ減速壁", "超アンチ転送壁", "超アンチ減速床", 
    "アンチ重力バリア", "アンチダメージウォール", "アンチワープ", "マインスイーパー", 
    "飛行", "アンチブロック", "アンチウィンド", "アンチ魔法陣", 
    "アンチ減速壁", "アンチ転送壁", "アンチ減速床"
];

const iconImages = {
    shotType: new Image(), luckSkill: new Image(), mainComboAttr: new Image(), subComboAttr: new Image(),
    abilityGauge: new Image()
};
iconImages.abilityGauge.src = 'ability_gauge.png'; 

let imagesToLoad = 0;
let imagesLoaded = 0;

function checkLoadComplete() {
    if (imagesLoaded >= imagesToLoad) { drawAndSave(); }
}

function updateIconImages() {
    const imagesSrcMap = {
        shotType: getShotTypeImageSrc(), luckSkill: getLuckSkillImageSrc(),
        mainComboAttr: getComboAttributeImageSrc(true), subComboAttr: getComboAttributeImageSrc(false),
        abilityGauge: 'ability_gauge.png'
    };
    
    imagesToLoad = 0; imagesLoaded = 0;
    
    for (const key in imagesSrcMap) {
        const src = imagesSrcMap[key];
        if (src) { 
            if (iconImages[key].src !== new URL(src, document.baseURI).href) {
                imagesToLoad++; 
                iconImages[key].onload = () => { imagesLoaded++; checkLoadComplete(); };
                iconImages[key].onerror = () => { imagesLoaded++; checkLoadComplete(); };
                iconImages[key].src = src;
            } else { imagesLoaded++; }
        }
    }
    if (imagesToLoad === 0 || imagesToLoad === imagesLoaded) { drawAndSave(); }
}

function loadTemplate(filename) {
    if (!filename) { currentBackgroundImage = null; drawAndSave(); return; }
    templateImage.onload = function() { currentBackgroundImage = templateImage; drawAndSave(); };
    templateImage.onerror = function() { currentBackgroundImage = null; drawAndSave(); };
    templateImage.src = filename;
}

function getGlobalFont(size) {
    const fontRadio = document.querySelector('input[name="globalFont"]:checked');
    const family = fontRadio ? fontRadio.value : "sans-serif";
    
    const weight = document.querySelector('input[name="globalWeight"]:checked').value;
    return `${weight} ${size}px ${family}`;
}

function drawStatusImage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentBackgroundImage && currentBackgroundImage.complete && currentBackgroundImage.naturalWidth > 0) {
        ctx.drawImage(currentBackgroundImage, 0, 0, canvas.width, canvas.height); 
    } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    const selectedNumber = document.querySelector('input[name="number"]:checked').value;
    const isKAI = selectedNumber === '改';
    const isJYU = selectedNumber === '獣神化';
    const isSHIN = selectedNumber === '真';

    const ssDrawY = isJYU ? parseInt(inputs.ssY_jyu.value, 10) : parseInt(inputs.ssY_shinKai.value, 10);
    const mainComboDrawY = isJYU ? parseInt(inputs.mainComboY_jyu.value, 10) : parseInt(inputs.mainComboY_shinKai.value, 10);
    const subComboDrawY = isJYU ? parseInt(inputs.subComboY_jyu.value, 10) : parseInt(inputs.subComboY_shinKai.value, 10);

    let ABILITY_BOX_REGION;
    if (isJYU) {
        ABILITY_BOX_REGION = { x: 530, y: 20, width: 890, height: 405 };
    } else {
        ABILITY_BOX_REGION = { x: 530, y: 20, width: 890, height: 305 };
    }

    const COMBO_ATTR_WIDTH_CANVAS = 128; 
    const COMBO_ATTR_HEIGHT_CANVAS = 72; 
    const MAIN_COMBO_ATTR_POS_CANVAS = { x: 720, y: mainComboDrawY }; 
    const COMBO_TEXT_START_X = MAIN_COMBO_ATTR_POS_CANVAS.x + COMBO_ATTR_WIDTH_CANVAS + 10;
    const COMBO_TEXT_MAX_WIDTH = 570; 

    const charImageX = parseInt(inputs.charImageX.value, 10);
    const charImageY = parseInt(inputs.charImageY.value, 10);
    const charImageWidth = parseInt(inputs.charImageWidth.value, 10);
    const charImageHeight = parseInt(inputs.charImageHeight.value, 10);

    const isMirrorEnabled = document.getElementById('enableMirror').checked;
    const mirrorHeight = parseInt(document.getElementById('mirrorHeight').value, 10);
    document.getElementById('mirrorHeightValue').textContent = mirrorHeight;
    if (currentCharImage && currentCharImage.complete) {
        //ctx.drawImage(currentCharImage, charImageX, charImageY, charImageWidth, charImageHeight);
        ctx.drawImage(currentCharImage, charImageX, charImageY, charImageWidth, charImageHeight);
        if (isMirrorEnabled) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, charImageY + charImageHeight, canvas.width, mirrorHeight); 
            ctx.clip();
            const reflectY = charImageY + charImageHeight;
            ctx.scale(1, -1);
            ctx.drawImage(currentCharImage, charImageX, -reflectY - charImageHeight, charImageWidth, charImageHeight);
            const gradient = ctx.createLinearGradient(0, -reflectY, 0, -reflectY - mirrorHeight);
            gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)"); 
            gradient.addColorStop(1, "rgba(255, 255, 255, 0.0)"); 
            ctx.globalCompositeOperation = 'source-over'; 
            ctx.fillStyle = gradient;
            ctx.fillRect(charImageX, -reflectY - mirrorHeight, charImageWidth, mirrorHeight);
            ctx.restore();
        }
    }
    const fontRadio = document.querySelector('input[name="globalFont"]:checked');
    const isReggae = (fontRadio && fontRadio.value === "'Reggae One'");
    ctx.textAlign = 'center';
    ctx.fillStyle = "#FFFFFF"; 
    ctx.font = getGlobalFont(40);
    let charNameY = 40; 
    if (isReggae) charNameY = 39;
    
    autoResizeAndCenterText(ctx, inputs.charName.value, 235, charNameY, 30, 400, 40, 18, 26, '');

    ctx.fillStyle = "#FFFFFF"; 
    ctx.textAlign = 'center';
    ctx.font = getGlobalFont(30);
    let tribeBattleY = 779;
    if (isReggae) tribeBattleY = 783;

    ctx.fillText(`${inputs.tribeInput.value}`, 120, tribeBattleY);       
    let selectedBattleType = document.querySelector('input[name="battleType"]:checked').value;
    if (isSHIN || isKAI) {
        selectedBattleType = "超" + selectedBattleType;
    }
    ctx.fillText(selectedBattleType, 330, tribeBattleY);

    if (iconImages.shotType.complete && iconImages.shotType.naturalWidth > 0) { 
        ctx.drawImage(iconImages.shotType, 0, 575, 250, 250); 
    }

    const LUCK_ICON_POS_CANVAS = { x: 448, y: 738 }; 
    const LUCK_ICON_SIZE_CANVAS = 50; 
    if (iconImages.luckSkill.complete && iconImages.luckSkill.naturalWidth > 0) {
        ctx.drawImage(iconImages.luckSkill, LUCK_ICON_POS_CANVAS.x, LUCK_ICON_POS_CANVAS.y, LUCK_ICON_SIZE_CANVAS, LUCK_ICON_SIZE_CANVAS); 
    }

    // アビリティ描画部分
    {
        const numAbilities = abilities.length;
        if (numAbilities > 0) {
            const COLUMNS = 2; 
            const MAX_ROWS = 4; // 縦に最大4行までの制限
            
            let grid = [];
            let currentRow = 0;
            let currentCol = 0;
            let prevHasIcon = false;
            const isSeparate = inputs.separateGauge ? inputs.separateGauge.checked : false;

            // まずアビリティの配置を計算する
            abilities.forEach((abi, index) => {
                // 素アビからゲージアビに変わった時、チェックが入っていれば一段下げる（改行）
                if (index > 0 && isSeparate && !prevHasIcon && abi.hasIcon) {
                    if (currentCol !== 0) {
                        currentRow++;
                        currentCol = 0;
                    }
                }
                
                // 縦に最大4つまで（0〜3行目）の制限に収まるものだけを描画リストに入れる
                if (currentRow < MAX_ROWS) {
                    grid.push({ abi: abi, row: currentRow, col: currentCol });
                }
                
                currentCol++;
                if (currentCol >= COLUMNS) {
                    currentCol = 0;
                    currentRow++;
                }
                prevHasIcon = abi.hasIcon;
            });

            // 実際に配置された最大の行数を取得（最小1行、最大4行）
            const actualRows = grid.length > 0 ? Math.max(...grid.map(item => item.row)) + 1 : 1;

            // 実際の行数に応じてアビリティ枠の高さを動的に計算する（元の仕様）
            const TOTAL_ROW_HEIGHT = ABILITY_BOX_REGION.height / actualRows; 
            const ABI_AREA_HEIGHT = Math.max(30, TOTAL_ROW_HEIGHT - 5); 
            const COLUMN_GAP = 8;
            const ROW_GAP = TOTAL_ROW_HEIGHT - ABI_AREA_HEIGHT; 
            
            // 行数が少なくて枠が大きくなった場合でもアイコンがバランスよく配置されるように調整
            const GAUGE_ICON_SIZE = Math.min(50, ABI_AREA_HEIGHT * 0.8); 
            const GAUGE_ICON_PADDING = 5; 
            const ABI_BOX_WIDTH = (ABILITY_BOX_REGION.width - COLUMN_GAP) / COLUMNS;

            grid.forEach((item) => {
                const abi = item.abi;
                const row = item.row;
                const col = item.col; 
                
                const selectedAttribute = document.querySelector('input[name="attribute"]:checked').value;
                const attrColors = {"火": "#FFCCCC","水": "#CCEBFF","木": "#CCFFD0","光": "#F9FFCC","闇": "#F4CCFF"};
                const strokeColors = {"火": "#470000","水": "#000247","木": "#104700","光": "#474700","闇": "#310047"};
                const boxColor = attrColors[selectedAttribute] || "#FFCCCC";
                const strokeColor = strokeColors[selectedAttribute] || "#470000";

                const ABI_LEFT_X = ABILITY_BOX_REGION.x + (col * (ABI_BOX_WIDTH + COLUMN_GAP));
                const currentAbiY = ABILITY_BOX_REGION.y + (row * TOTAL_ROW_HEIGHT) + (ROW_GAP / 2); 
                
                ctx.fillStyle = boxColor;
                ctx.fillRect(ABI_LEFT_X, currentAbiY, ABI_BOX_WIDTH, ABI_AREA_HEIGHT);
                
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(ABI_LEFT_X, currentAbiY, ABI_BOX_WIDTH, ABI_AREA_HEIGHT);

                let fontSize = 40; 
                ctx.font = getGlobalFont(fontSize);
                
                let textWidth = ctx.measureText(abi.text).width;
                let availableWidth = ABI_BOX_WIDTH - 20; 
                if (abi.hasIcon) availableWidth -= (GAUGE_ICON_SIZE + GAUGE_ICON_PADDING);

                while (textWidth > availableWidth && fontSize > 16) {
                    fontSize--;
                    ctx.font = getGlobalFont(fontSize);
                    textWidth = ctx.measureText(abi.text).width;
                }

                let contentStartX;
                if (abi.hasIcon && iconImages.abilityGauge.complete && iconImages.abilityGauge.naturalWidth > 0) {
                    const totalContentWidth = GAUGE_ICON_SIZE + GAUGE_ICON_PADDING + textWidth;
                    contentStartX = ABI_LEFT_X + (ABI_BOX_WIDTH - totalContentWidth) / 2;

                    const iconY = currentAbiY + (ABI_AREA_HEIGHT / 2) - (GAUGE_ICON_SIZE / 2);
                    ctx.drawImage(iconImages.abilityGauge, contentStartX, iconY, GAUGE_ICON_SIZE, GAUGE_ICON_SIZE); 

                    ctx.fillStyle = inputs.abilityColor.value;
                    ctx.textAlign = 'left'; 
                    ctx.textBaseline = 'middle'; 
                    ctx.fillText(abi.text, contentStartX + GAUGE_ICON_SIZE + GAUGE_ICON_PADDING, currentAbiY + (ABI_AREA_HEIGHT / 2));
                } else {
                    ctx.fillStyle = inputs.abilityColor.value;
                    ctx.textAlign = 'center'; 
                    ctx.textBaseline = 'middle'; 
                    ctx.fillText(abi.text, ABI_LEFT_X + (ABI_BOX_WIDTH / 2), currentAbiY + (ABI_AREA_HEIGHT / 2));
                }
            });
        }
    }
    
    if (isSHIN || isKAI) {
        const connY = 356; 
        ctx.textAlign = 'center';
        
        if (isKAI) {
            ctx.fillStyle = inputs.connectSkillColor.value; 
        } else {
            ctx.fillStyle = inputs.assistShotSsDescColor.value;
        }

        if (isKAI) {
            const CONNECT_SKILL_AREA = { x: 740, y: connY, width: 680, height: 40 }; 
            const connectedText = connectSkills.map(skill => skill.text).join(' / ');
            const lineHeight = 26; 

            autoResizeAndCenterText(ctx, connectedText, CONNECT_SKILL_AREA.x + (CONNECT_SKILL_AREA.width / 2), CONNECT_SKILL_AREA.y, CONNECT_SKILL_AREA.height, CONNECT_SKILL_AREA.width - 20, 30, 16, lineHeight, '', 'center');
            
        } else { 
            const assistText = inputs.assistSkill_nonKai.value;
            autoResizeAndCenterText(ctx, assistText, 1070, connY, 40, 680, 40, 16, 26, '', 'center');
        }
    }

    if (isSHIN || isKAI) {
        const shotY = 442;
        ctx.textAlign = 'center';
        
        if (isKAI) {
            ctx.fillStyle = inputs.connectConditionColor.value; 
        } else {
            ctx.fillStyle = inputs.assistShotSsDescColor.value;
        }
        
        const textToDraw = isKAI ? inputs.connectSkillCondition.value : inputs.shotSkill_nonKai.value;

        autoResizeAndCenterText(ctx, textToDraw, 1070, shotY, 50, 680, 40, 16, 26, '', 'center');
    }

    ctx.fillStyle = inputs.ssTurnColor.value;
    ctx.textAlign = 'center';
    ctx.font = getGlobalFont(37);
    const ssTurn = `${inputs.ssTurn1.value}＋${inputs.ssTurn2.value}`;
    let ssTurnY = ssDrawY ; 
    if (isReggae) ssTurnY = ssDrawY ; 

    ctx.fillText(ssTurn, 604, ssTurnY);
    
    ctx.fillStyle = inputs.ssDescColor.value;
    autoResizeAndCenterText(ctx, inputs.strikeShotText.value, 1070, ssDrawY, -68, 680, 40, 25, 26, '', 'center');

    const mainAttrX = parseInt(inputs.mainComboImageX.value, 10);
    const subAttrX = parseInt(inputs.subComboImageX.value, 10);
    const mainAttrY = isJYU ? parseInt(inputs.mainComboY_jyu.value, 10) : parseInt(inputs.mainComboY_shinKai.value, 10);
    const subAttrY = isJYU ? parseInt(inputs.subComboY_jyu.value, 10) : parseInt(inputs.subComboY_shinKai.value, 10);
    
    if (iconImages.mainComboAttr.complete && iconImages.mainComboAttr.naturalWidth > 0) {
        ctx.drawImage(iconImages.mainComboAttr, 720, mainAttrY, COMBO_ATTR_WIDTH_CANVAS, COMBO_ATTR_HEIGHT_CANVAS);
    }

    if (mainComboUserImage && mainComboUserImage.complete) {
        const userWidth = parseInt(inputs.mainComboWidth.value, 10);
        const userHeight = parseInt(inputs.mainComboHeight.value, 10);
        const customY = isJYU ? parseInt(inputs.mainComboImageY_jyu.value, 10) : parseInt(inputs.mainComboImageY.value, 10);
        ctx.drawImage(mainComboUserImage, mainAttrX, customY, userWidth, userHeight); 
    }

    ctx.fillStyle = inputs.comboDescColor.value; 
    ctx.textAlign = 'left';
    autoResizeAndCenterText(ctx, inputs.mainComboText.value, COMBO_TEXT_START_X, mainAttrY, COMBO_ATTR_HEIGHT_CANVAS, COMBO_TEXT_MAX_WIDTH, 40, 25, 26, '', 'left');

    if (iconImages.subComboAttr.complete && iconImages.subComboAttr.naturalWidth > 0) {
        ctx.drawImage(iconImages.subComboAttr, 720, subAttrY, COMBO_ATTR_WIDTH_CANVAS, COMBO_ATTR_HEIGHT_CANVAS); 
    }

    if (subComboUserImage && subComboUserImage.complete) {
        const userWidth = parseInt(inputs.subComboWidth.value, 10);
        const userHeight = parseInt(inputs.subComboHeight.value, 10);
        const customY = isJYU ? parseInt(inputs.subComboImageY_jyu.value, 10) : parseInt(inputs.subComboImageY.value, 10);
        ctx.drawImage(subComboUserImage, subAttrX, customY, userWidth, userHeight); 
    }

    ctx.fillStyle = inputs.comboDescColor.value; 
    ctx.textAlign = 'left'; 
    autoResizeAndCenterText(ctx, inputs.subComboText.value, COMBO_TEXT_START_X, subAttrY, COMBO_ATTR_HEIGHT_CANVAS, COMBO_TEXT_MAX_WIDTH, 40, 20, 26, '', 'left');

    ctx.fillStyle = 'rgba(0, 0, 0,)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("※コラ画像です", canvas.width - 15, canvas.height - 1);
}

function collectDataToSave() {
    const charNameTag = inputs.charName.value ? `【${inputs.charName.value}】` : '【名称未設定】';
    
    const data = {
        _memoInfo: `${charNameTag}のバックアップデータ (このテキストをコピーして保存)`,
        ...Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.type === 'checkbox' ? input.checked : input.value])),
        attribute: document.querySelector('input[name="attribute"]:checked')?.value,
        number: document.querySelector('input[name="number"]:checked')?.value,
        globalWeight: document.querySelector('input[name="globalWeight"]:checked')?.value,
        globalFont: document.querySelector('input[name="globalFont"]:checked')?.value,
        battleType: document.querySelector('input[name="battleType"]:checked')?.value,
        shotType: document.querySelector('input[name="shotType"]:checked')?.value,
        luckSkill: document.querySelector('input[name="luckSkill"]:checked')?.value,
        mainComboAttribute: document.querySelector('input[name="mainComboAttribute"]:checked')?.value,
        subComboAttribute: document.querySelector('input[name="subComboAttribute"]:checked')?.value,
        abilities: abilities,
        connectSkills: connectSkills,
        charImgSettingsDisplay: charImgSettingsDiv.style.display,
    };
    return data;
}

function saveSettings() {
    try {
        const data = collectDataToSave();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
    }
}

function applyData(data) {
    if (!data) return false;

    for (const key in data) {
        if (inputs[key] && data[key] !== undefined && data[key] !== null) {
            if (inputs[key].type === 'checkbox') {
                inputs[key].checked = data[key];
            } else {
                inputs[key].value = data[key];
            }
        }
    }

    const radioGroups = ['attribute', 'number', 'globalWeight', 'battleType', 'shotType', 'luckSkill', 'mainComboAttribute', 'subComboAttribute', 'globalFont'];
    radioGroups.forEach(group => {
        if (data[group]) {
            const radio = document.querySelector(`input[name="${group}"][value="${data[group]}"]`);
            if (radio) radio.checked = true;
        }
    });

    if (data.abilities && Array.isArray(data.abilities)) {
        abilities = data.abilities;
    } else {
        abilities = []; 
    }
    renderAbilityFields(); 

    if (data.connectSkills && Array.isArray(data.connectSkills)) {
        connectSkills = data.connectSkills;
    } else {
        connectSkills = [];
    }
    renderConnectSkillFields(); 

    currentCharImage = null;
    mainComboUserImage = null;
    subComboUserImage = null;

    document.getElementById('charImageUpload').value = "";
    document.getElementById('mainComboImageUpload').value = "";
    document.getElementById('subComboImageUpload').value = "";

    charImgSettingsDiv.style.display = 'none';
    document.getElementById('mainComboImageSettings').style.display = 'none';
    document.getElementById('subComboImageSettings').style.display = 'none';

    updateFormVisibility();
    updateIconImages();
    loadTemplate(getSelectedTemplateFilename());
    setupNumberInputPlaceholder('ssTurn1');
    setupNumberInputPlaceholder('ssTurn2');

    return true;
}

function loadSettings() {
    try {
        const dataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!dataString) return false;
        const data = JSON.parse(dataString);
        return applyData(data);
    } catch (e) {
        return false;
    }
}

function drawAndSave() {
    drawStatusImage();
    saveSettings();
}

function getSelectedTemplateFilename() {
    const selectedAttribute = document.querySelector('input[name="attribute"]:checked');
    const selectedNumber = document.querySelector('input[name="number"]:checked');
    if (selectedAttribute && selectedNumber) {
        return `${selectedNumber.value}${selectedAttribute.value}.png`;
    }
    return null;
}

function getShotTypeImageSrc() {
    const selectedShotType = document.querySelector('input[name="shotType"]:checked').value;
    const hasGauge = abilities.some(abi => abi.hasIcon);
    if (hasGauge) {
        return `shot_${selectedShotType}_gauge.png`;
    } else {
        return `shot_${selectedShotType}.png`;
    }
}

function getLuckSkillImageSrc() {
    const selectedLuck = document.querySelector('input[name="luckSkill"]:checked');
    if (selectedLuck) {
        const luckValueMap = {
            "ガイド": "luck_guide.png", "友クリ": "luck_yucri.png",        
            "シールド": "luck_shield.png", "クリティカル": "luck_critical.png"  
        };
        return `${luckValueMap[selectedLuck.value]}`; 
    }
    return null;
}

function getComboAttributeImageSrc(isMainCombo) {
    const comboName = isMainCombo ? 'mainComboAttribute' : 'subComboAttribute';
    const selectedRadio = document.querySelector(`input[name="${comboName}"]:checked`);
    if (!selectedRadio) return null;
    const attr = selectedRadio.value; 
    const attrBase = ATTRIBUTE_MAP[attr] || null; 
    if (!attrBase) return null;
    return `attr_${attrBase}_combo.png`;
}

function handleComboImageUpload(event, type) {
    const file = event.target.files[0];
    const settingsDiv = type === 'main' ? document.getElementById('mainComboImageSettings') : document.getElementById('subComboImageSettings');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const userImage = new Image();
            userImage.onload = function() {
                if (type === 'main') { mainComboUserImage = userImage; } 
                else { subComboUserImage = userImage; }
                drawAndSave(); 
                if (settingsDiv) settingsDiv.style.display = 'block'; 
            };
            userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        if (type === 'main') { mainComboUserImage = null; } 
        else { subComboUserImage = null; }
        drawAndSave();
        if (settingsDiv) settingsDiv.style.display = 'none'; 
    }
}

function updateFormVisibility() {
    const selectedNumber = document.querySelector('input[name="number"]:checked').value;
    const isKAI = selectedNumber === '改';
    const isJYU = selectedNumber === '獣神化';
    const isSHIN = selectedNumber === '真';
    
    connectSkillControlsDiv.style.display = isKAI ? 'block' : 'none';
    
    const assistInput = inputs.assistSkill_nonKai;
    const shotInput = inputs.shotSkill_nonKai;
    const connectConditionInput = inputs.connectSkillCondition;
    
    const shinSkillColors = document.getElementById('shinSkillColors');
    const kaiSkillColors = document.getElementById('kaiSkillColors');

    const shinkaiLabels = document.querySelectorAll('.y-label-shinkai');
    const shinkaiInputs = document.querySelectorAll('.input-shinkai');
    const jyuLabels = document.querySelectorAll('.y-label-jyu');
    const jyuInputs = document.querySelectorAll('.input-jyu');

    if (isSHIN) {
        assistInput.style.display = 'block'; shotInput.style.display = 'block';
        assistSkillLabel.style.display = 'block'; shotSkillLabel.textContent = '【ショットスキル】'; assistSkillLabel.textContent = '【アシストスキル】';
        connectConditionInput.style.display = 'none';
        shinSkillColors.style.display = 'flex'; kaiSkillColors.style.display = 'none';

    } else if (isKAI) {
        assistInput.style.display = 'none'; shotInput.style.display = 'none';
        assistSkillLabel.style.display = 'block'; assistSkillLabel.textContent = '【コネクトスキル】';
        shotSkillLabel.style.display = 'block'; shotSkillLabel.textContent = '【発動条件】';
        connectConditionInput.style.display = 'block';
        shinSkillColors.style.display = 'none'; kaiSkillColors.style.display = 'flex';

    } else {
        assistInput.style.display = 'none'; shotInput.style.display = 'none';
        connectConditionInput.style.display = 'none';
        assistSkillLabel.style.display = 'none'; shotSkillLabel.style.display = 'none';
        shinSkillColors.style.display = 'none'; kaiSkillColors.style.display = 'none';
    }
    
    if (isJYU) {
        shinkaiLabels.forEach(el => el.style.display = 'none'); shinkaiInputs.forEach(el => el.style.display = 'none');
        jyuLabels.forEach(el => el.style.display = 'inline'); jyuInputs.forEach(el => el.style.display = 'inline-block');
    } else {
        shinkaiLabels.forEach(el => el.style.display = 'inline'); shinkaiInputs.forEach(el => el.style.display = 'inline-block');
        jyuLabels.forEach(el => el.style.display = 'none'); jyuInputs.forEach(el => el.style.display = 'none');
    }
    
    drawAndSave();
}

function createAbilityField(index) {
    const div = document.createElement('div');
    div.className = 'ability-item';
    
    // 並び替えモード時の◻︎ボタン
    if (isSortMode) {
        const sortBox = document.createElement('div');
        sortBox.className = 'sort-box';
        sortBox.id = `sort-box-${index}`;
        div.appendChild(sortBox);
    }

    // ゲージのトグル（画像/丸）
    const gaugeToggle = document.createElement('div');
    gaugeToggle.className = 'gauge-toggle';
    if (abilities[index].hasIcon) {
        gaugeToggle.classList.add('active');
    }
    gaugeToggle.title = 'クリックでゲージの有無を切り替えます';
    
    if (!isSortMode) {
        gaugeToggle.onclick = () => {
            abilities[index].hasIcon = !abilities[index].hasIcon;
            renderAbilityFields(); 
            updateIconImages();
            drawAndSave();
        };
    } else {
        gaugeToggle.style.opacity = '0.5';
        gaugeToggle.style.cursor = 'not-allowed';
    }
    div.appendChild(gaugeToggle);

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'ability-input-wrapper';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = abilities[index].text;
    textInput.placeholder = "アビリティを入力"; 
    
    const suggestList = document.createElement('ul');
    suggestList.className = 'suggest-list';

    // (中略) ... テキスト入力とカスタムドロップダウンのラッパー設定

    // ▼ ひらがなをカタカナに変換する便利関数
    const hiraToKata = (str) => {
        return str.replace(/[\u3041-\u3096]/g, match => {
            return String.fromCharCode(match.charCodeAt(0) + 0x60);
        });
    };

    // 候補リストを描画する関数
    const renderSuggest = (filterText) => {
        suggestList.innerHTML = '';
        
        if (!filterText || filterText.trim() === '') {
            suggestList.style.display = 'none';
            return;
        }

        const searchWordKana = hiraToKata(filterText);
        const searchWordLower = filterText.toLowerCase();

        // 英語の小文字一致(text)、またはカタカナ一致(kana)で絞り込む
        const filtered = ALL_ABILITIES.filter(opt => 
            opt.text.toLowerCase().includes(searchWordLower) || 
            opt.kana.includes(searchWordKana)
        );
        
        if (filtered.length === 0) {
            suggestList.style.display = 'none';
            return;
        }
        
        // 検索結果が多すぎる場合は画面が埋まらないよう制限
        filtered.slice(0, 30).forEach(opt => {
            const li = document.createElement('li');
            
            // 入力文字に一致する部分を太字にする（表示される漢字テキストに対して）
            const regex = new RegExp(`(${filterText}|${searchWordKana})`, 'gi');
            li.innerHTML = opt.text.replace(regex, '<strong>$1</strong>');
            
            li.onclick = () => {
                textInput.value = opt.text;       // クリックされたら「表示名」を入れる
                abilities[index].text = opt.text; // 配列にも「表示名」を保存
                suggestList.style.display = 'none';
                drawAndSave();
            };
            suggestList.appendChild(li);
        });
        suggestList.style.display = 'block';
    };

    if (!isSortMode) {
        // フォーカス時：以前入っていた文字でサジェスト検索
        textInput.onfocus = (e) => renderSuggest(e.target.value);
        
        // 文字入力するたびに部分一致でリストを更新
        textInput.oninput = (e) => {
            abilities[index].text = e.target.value;
            renderSuggest(e.target.value);
            drawAndSave();
        };
        
        // フォーカスが外れたら少し遅れて閉じる（タップ判定を優先するため）
        textInput.onblur = () => {
            setTimeout(() => {
                suggestList.style.display = 'none';
            }, 200);
        };
    } else {
        textInput.disabled = true;
    }
    
    inputWrapper.appendChild(textInput);
    inputWrapper.appendChild(suggestList);
    div.appendChild(inputWrapper);
    
    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✖︎';
    
    if (!isSortMode) {
        deleteBtn.onclick = () => {
            abilities.splice(index, 1);
            renderAbilityFields();
            updateIconImages(); 
            drawAndSave();
        };
    } else {
        deleteBtn.disabled = true;
        deleteBtn.style.opacity = '0.5';
    }
    div.appendChild(deleteBtn);
    
    return div;
}

function updateSortBoxes() {
    if (!isSortMode) return;

    // 素アビ（ゲージなし）の総数と、現在選択されている素アビの数を計算
    const totalSuAbi = abilities.filter(a => !a.hasIcon).length;
    const selectedSuAbi = sortOrder.filter(i => !abilities[i].hasIcon).length;

    abilities.forEach((abi, index) => {
        const sortBox = document.getElementById(`sort-box-${index}`);
        if (!sortBox) return;

        // 一旦状態をリセット
        sortBox.className = 'sort-box';
        sortBox.textContent = '';
        sortBox.onclick = null;
        sortBox.title = '';

        const orderIndex = sortOrder.indexOf(index);
        if (orderIndex !== -1) {
            // 選択済みの場合は数字を表示
            sortBox.classList.add('selected');
            sortBox.textContent = orderIndex + 1;
            sortBox.onclick = () => {
                // クリックで自分以降の選択を解除
                sortOrder.splice(orderIndex);
                updateSortBoxes();
            };
        } else {
            // 未選択の場合の制御：素アビが全て選択されるまでゲージアビは選択不可
            if (abi.hasIcon && selectedSuAbi < totalSuAbi) {
                sortBox.classList.add('disabled');
                sortBox.title = '先に素アビリティ（ゲージなし）を選択してください';
            } else {
                sortBox.onclick = () => {
                    sortOrder.push(index);
                    updateSortBoxes();
                };
            }
        }
    });
}

function renderAbilityFields() {
    abilityListDiv.innerHTML = '';
    abilities.forEach((abi, index) => {
        abilityListDiv.appendChild(createAbilityField(index));
    });

    const startSortBtn = document.getElementById('startSortBtn');
    const sortModeActions = document.getElementById('sortModeActions');

    // 並び替えモード中の表示切り替え
    if (!isSortMode) {
        addAbilityBtn.style.display = abilities.length < MAX_ABILITIES ? 'block' : 'none';
        if (startSortBtn) startSortBtn.style.display = abilities.length > 1 ? 'inline-block' : 'none';
        if (sortModeActions) sortModeActions.style.display = 'none';
    } else {
        addAbilityBtn.style.display = 'none';
        if (startSortBtn) startSortBtn.style.display = 'none';
        if (sortModeActions) sortModeActions.style.display = 'flex';
    }
    
    updateSortBoxes();
}

addAbilityBtn.onclick = () => {
    if (abilities.length < MAX_ABILITIES) {
        abilities.push({ hasIcon: false, text: '' }); 
        renderAbilityFields();
        drawAndSave();
    }
};

function createConnectSkillField(index) {
    const div = document.createElement('div');
    div.className = 'ability-item';
    div.style.marginBottom = '5px';
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = connectSkills[index].text;
    textInput.placeholder = "コネクトスキルを入力";
    textInput.oninput = (e) => {
        connectSkills[index].text = e.target.value;
        drawAndSave();
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✖︎';
    deleteBtn.onclick = () => {
        connectSkills.splice(index, 1);
        renderConnectSkillFields();
        drawAndSave();
    };
    
    div.appendChild(textInput);
    div.appendChild(deleteBtn);
    
    return div;
}

function renderConnectSkillFields() {
    connectSkillListDiv.innerHTML = '';
    connectSkills.forEach((skill, index) => {
        connectSkillListDiv.appendChild(createConnectSkillField(index));
    });

    addConnectSkillBtn.style.display = connectSkills.length < MAX_CONNECT_SKILLS ? 'block' : 'none';
}

addConnectSkillBtn.onclick = () => {
    if (connectSkills.length < MAX_CONNECT_SKILLS) {
        connectSkills.push({ text: '' });
        renderConnectSkillFields();
        drawAndSave();
    }
};

function initTribeModal() {
    const grid = document.getElementById('tribeGrid');
    grid.innerHTML = ''; 
    TRIBE_LIST.forEach(tribe => {
        const btn = document.createElement('button');
        btn.textContent = tribe;
        btn.onclick = () => {
            inputs.tribeInput.value = tribe;
            document.getElementById('tribeModal').style.display = 'none';
            drawAndSave();
        };
        grid.appendChild(btn);
    });

    document.getElementById('tribeBtn').onclick = () => {
        document.getElementById('tribeModal').style.display = 'block';
    };
    document.getElementById('closeTribeModal').onclick = () => {
        document.getElementById('tribeModal').style.display = 'none';
    };
}

function resetAllSettings() {
    const confirmReset = confirm(
        "⚠️ 全ての設定を初期状態に戻します。\n自動保存されたデータもすべて削除されますがよろしいですか？\n\n【警告】この操作は元に戻せません。"
    );

    if (confirmReset) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        window.location.reload(); 
    }
}

function initHelpModal() {
    helpBtn.onclick = () => {
        helpModal.style.display = 'block';
    };
    document.getElementById('closeHelpModal').onclick = () => {
        helpModal.style.display = 'none';
    };
}

function autoResizeAndCenterText(ctx, text, x, startY, height, maxWidth, initialSize, minSize, lineHeight, fontName = '', textAlign = 'center') {
    
    const originalFont = ctx.font;
    const originalFillStyle = ctx.fillStyle;
    const originalTextAlign = ctx.textAlign;
    const originalTextBaseline = ctx.textBaseline; 

    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle'; 

    let fontSize = initialSize;
    let finalLines = []; 

    ctx.font = getGlobalFont(fontSize);
    let textWidth = ctx.measureText(text).width;
    
    if (textWidth <= maxWidth) {
        finalLines = [text];
    } else {
        let currentSize = fontSize;
        let foundFit = false;
        while (currentSize >= minSize) {
            ctx.font = getGlobalFont(currentSize);
            textWidth = ctx.measureText(text).width;
            if (textWidth <= maxWidth) {
                finalLines = [text];
                fontSize = currentSize;
                foundFit = true;
                break;
            }
            currentSize--;
        }
        if (!foundFit) {
            fontSize = minSize; 
            ctx.font = getGlobalFont(fontSize);
            
            let words = text.split('');
            let line = '';
            finalLines = [];
            
            for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n];
                let testMetrics = ctx.measureText(testLine);
                
                if (testMetrics.width > maxWidth && n > 0) {
                    finalLines.push(line);
                    line = words[n];
                } else {
                    line = testLine;
                }
            }
            finalLines.push(line);
        }
    }


    const totalTextHeight = finalLines.length * lineHeight;
    const drawYCenter = startY + (height / 2); 

    let firstLineY = drawYCenter - (totalTextHeight / 2) + (lineHeight / 2); 

    for (let i = 0; i < finalLines.length; i++) {
        ctx.fillText(finalLines[i], x, firstLineY + (i * lineHeight));
    }
    
    ctx.font = originalFont;
    ctx.fillStyle = originalFillStyle;
    ctx.textAlign = originalTextAlign;
    ctx.textBaseline = originalTextBaseline;
}

function setupNumberInputPlaceholder(inputId) {
    const input = document.getElementById(inputId);
    input.setAttribute('data-default', input.value); 
    
    input.addEventListener('focus', () => {
        if (input.value === input.getAttribute('data-default')) {
            input.value = '';
        }
    });

    input.addEventListener('blur', () => {
        if (input.value === '' || isNaN(parseInt(input.value))) {
            input.value = input.getAttribute('data-default');
        }
        drawAndSave(); 
    });
}

function loadInitialImages() {
    const loaded = loadSettings();

    if (!loaded) {
        abilities = [
            { hasIcon: false, text: '' },
            { hasIcon: false, text: '' },
            { hasIcon: false, text: '' },
            { hasIcon: false, text: '' }
        ];

        connectSkills = [
            { text: '' },
            { text: '' }
        ];

        document.getElementById('weight_bold').checked = true;
        document.getElementById('attr_fire').checked = true;
        document.getElementById('num_shin').checked = true;
        document.getElementById('type_balance').checked = true;
        document.getElementById('shot_reflect').checked = true;
        document.getElementById('luck_guide').checked = true;
        document.getElementById('main_attr_fire').checked = true;
        document.getElementById('sub_attr_dark').checked = true;
        document.getElementById('font_standard').checked = true;
    }
    
    renderConnectSkillFields();
    renderAbilityFields();

    setupNumberInputPlaceholder('ssTurn1'); 
    setupNumberInputPlaceholder('ssTurn2'); 

    document.fonts.ready.then(function () {
        updateIconImages(); 
        loadTemplate(getSelectedTemplateFilename()); 
        updateFormVisibility(); 
    });
}

Object.values(inputs).forEach(input => {
    if (input) input.addEventListener('input', drawAndSave);
});

document.getElementById('battleTypeSelect').addEventListener('change', drawAndSave);
document.querySelectorAll('input[name="globalWeight"]').forEach(radio => {
    radio.addEventListener('change', drawAndSave);
});

document.querySelectorAll('input[name="globalFont"]').forEach(radio => {
    radio.addEventListener('change', drawAndSave);
});

shotTypeSelectDiv.addEventListener('change', updateIconImages); 
luckSkillSelectDiv.addEventListener('change', updateIconImages); 
mainComboAttributeRadioGroup.addEventListener('change', updateIconImages);
subComboAttributeRadioGroup.addEventListener('change', updateIconImages);

attributeSelectDiv.addEventListener('change', () => { loadTemplate(getSelectedTemplateFilename()); });
numberSelectDiv.addEventListener('change', () => { 
    loadTemplate(getSelectedTemplateFilename());
    updateFormVisibility(); 
});

mainComboImageUpload.addEventListener('change', (e) => handleComboImageUpload(e, 'main'));
subComboImageUpload.addEventListener('change', (e) => handleComboImageUpload(e, 'sub'));

document.getElementById('charImageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const userImage = new Image();
            userImage.onload = function() {
                currentCharImage = userImage;
                drawAndSave();
                charImgSettingsDiv.style.display = 'block';
            };
            userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        currentCharImage = null;
        drawAndSave();
        charImgSettingsDiv.style.display = 'none';
    }
});

document.getElementById('downloadBtn').addEventListener('click', function() {
    const imageURL = canvas.toDataURL('image/png'); 
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = 'custom_character_status_1440x810.png'; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

resetBtn.addEventListener('click', resetAllSettings);

const saveLoadModal = document.getElementById('saveLoadModal');
const ioTextarea = document.getElementById('ioTextarea');

document.getElementById('openSaveLoadBtn').onclick = () => {
    ioTextarea.value = "";
    saveLoadModal.style.display = 'block';
};

document.getElementById('closeSaveLoadModal').onclick = () => {
    saveLoadModal.style.display = 'none';
};

async function copyTextToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            alert('コピーしました！ (Plain Text)');
            return;
        }
    } catch (err) {}

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'コピーしました！' : 'コピーに失敗しました';
        alert(msg);
    } catch (err) {
        alert('コピーできませんでした。手動でコピーしてください。');
    }
    document.body.removeChild(textArea);
}

document.getElementById('generateCodeBtn').onclick = () => {
    const data = collectDataToSave();
    delete data._memoInfo; 
    const jsonString = JSON.stringify(data);
    
    try {
        const base64Data = window.btoa(unescape(encodeURIComponent(jsonString)));
        
        const charName = inputs.charName.value || '名称未設定';
        const formattedText = `${charName}： ${base64Data}`;
        
        ioTextarea.value = formattedText;
        
        copyTextToClipboard(formattedText);
        
    } catch(e) {
        alert('コード生成に失敗しました: ' + e.message);
    }
};

document.getElementById('loadJsonBtn').onclick = () => {
    try {
        let inputStr = ioTextarea.value.trim();
        
        if (!inputStr) {
            alert('データが空です。');
            return;
        }

        if (inputStr.includes('：') || inputStr.includes(':')) {
            const parts = inputStr.split(/[:：]/);
            const possibleCode = parts[parts.length - 1].trim();
            if (/^[A-Za-z0-9+/=]+$/.test(possibleCode)) {
                inputStr = possibleCode;
            }
        }

        try {
            const decodedStr = decodeURIComponent(escape(window.atob(inputStr)));
            JSON.parse(decodedStr); 
            inputStr = decodedStr; 
        } catch (e) {}
        
        const data = JSON.parse(inputStr);
        const success = applyData(data);
        
        if (success) {
            drawAndSave(); 
            saveLoadModal.style.display = 'none';
            alert('設定を復元しました！\n※画像ファイルは手動で再設定してください。');
        } else {
            alert('データの形式が正しくありません。');
        }
    } catch (e) {
        alert('読み込みに失敗しました。\n正しいデータか確認してください。\n' + e.message);
    }
};

window.onclick = (event) => {
    if (event.target == document.getElementById('tribeModal')) {
        document.getElementById('tribeModal').style.display = 'none';
    }
    if (event.target == document.getElementById('helpModal')) {
        document.getElementById('helpModal').style.display = 'none';
    }
    if (event.target == saveLoadModal) {
        saveLoadModal.style.display = 'none';
    }
};

function getHistoryData() {
    try {
        const data = localStorage.getItem(HISTORY_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function renderHistoryList() {
    const list = getHistoryData();
    const container = document.getElementById('historyListContainer');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<p style="font-size:0.8rem; color:#888; text-align:center; margin:10px;">保存されたデータはありません</p>';
        return;
    }

    list.slice().reverse().forEach((item, reverseIndex) => {
        const originalIndex = list.length - 1 - reverseIndex;

        const div = document.createElement('div');
        div.className = 'history-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'history-name';
        nameSpan.textContent = item.name || '名称未設定';
        nameSpan.title = `保存日時: ${item.date}`;
        nameSpan.onclick = () => {
            if (confirm(`「${item.name}」のデータを読み込みますか？\n※現在の編集内容は上書きされます。`)) {
                applyData(item.data);
                drawAndSave();
            }
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'history-delete';
        delBtn.innerHTML = '🗑';
        delBtn.title = '削除';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`「${item.name}」を削除しますか？`)) {
                deleteHistoryItem(originalIndex);
            }
        };

        div.appendChild(nameSpan);
        div.appendChild(delBtn);
        container.appendChild(div);
    });
}

function saveToHistoryList() {
    const currentData = collectDataToSave();
    delete currentData._memoInfo;

    const charName = inputs.charName.value || '名称未設定';
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newItem = {
        name: charName,
        date: dateStr,
        data: currentData
    };

    const list = getHistoryData();
    list.push(newItem);

    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
        renderHistoryList();
        
        const details = document.getElementById('historyDetails');
        if(details && !details.open) {
            details.open = true;
        }

        alert(`「${charName}」をリストに保存しました！`);
    } catch (e) {
        alert('保存に失敗しました。容量オーバーの可能性があります。不要なデータを削除してください。');
    }
}

function deleteHistoryItem(index) {
    const list = getHistoryData();
    list.splice(index, 1);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
    renderHistoryList();
}

document.getElementById('saveLocalBtn').addEventListener('click', saveToHistoryList);

renderHistoryList();

initTribeModal();
initHelpModal(); 
loadInitialImages();

// 並び替えボタンのイベント
const startSortBtn = document.getElementById('startSortBtn');
if (startSortBtn) {
    startSortBtn.addEventListener('click', () => {
        isSortMode = true;
        sortOrder = [];
        renderAbilityFields();
    });
}

const applySortBtn = document.getElementById('applySortBtn');
if (applySortBtn) {
    applySortBtn.addEventListener('click', () => {
        if (sortOrder.length !== abilities.length) {
            alert('すべてのアビリティの順番を選択してください。');
            return;
        }
        // 選択された順番で配列を再構築
        const newAbilities = sortOrder.map(i => abilities[i]);
        abilities = newAbilities;
        isSortMode = false;
        renderAbilityFields();
        drawAndSave();
    });
}

const cancelSortBtn = document.getElementById('cancelSortBtn');
if (cancelSortBtn) {
    cancelSortBtn.addEventListener('click', () => {
        isSortMode = false;
        renderAbilityFields();
    });
}