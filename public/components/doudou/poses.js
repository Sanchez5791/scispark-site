/* ============================================================
 * /components/doudou/poses.js
 * 豆豆 v03 · 黄豆型 · 16 inline-SVG poses · vanilla, no module
 * source: doudou_v03_soybean_16pose.html (Sanchez 2026-05-20)
 * design tokens: #F5F4F1 body / #1A1A1A feet / #EA580C eye / Fraunces serif
 * viewBox: P01-P13 = 200x240 (single) · P14-P15 = 400x280 (team/duo) · P16 = 480x280 (trio)
 * ============================================================ */
(function () {
  'use strict';

  var POSES = {
    P01: {
      id: 'P01',
      en: 'Idle',
      cn: '待机',
      note: 'default · 神情 = 单白点',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <!-- soybean body --> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- arms (hanging) --> <ellipse cx="36" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="164" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- eye --> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- eye symbol: neutral dot --> <rect x="97" y="92" width="6" height="6" fill="#F5F4F1"/> <!-- 豆 --> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <!-- feet --> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </svg>'
    },
    P02: {
      id: 'P02',
      en: 'Greeting',
      cn: '打招呼',
      note: '打招呼 · 神情 = 心 · 单手挥',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- left arm hanging --> <ellipse cx="36" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- right arm raised wave --> <ellipse cx="178" cy="80" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(35 178 95)"/> <!-- eye --> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- pixel heart --> <g fill="#F5F4F1"> <rect x="91" y="86" width="3" height="3"/> <rect x="94" y="86" width="3" height="3"/> <rect x="103" y="86" width="3" height="3"/> <rect x="106" y="86" width="3" height="3"/> <rect x="88" y="89" width="3" height="3"/> <rect x="91" y="89" width="3" height="3"/> <rect x="94" y="89" width="3" height="3"/> <rect x="97" y="89" width="3" height="3"/> <rect x="100" y="89" width="3" height="3"/> <rect x="103" y="89" width="3" height="3"/> <rect x="106" y="89" width="3" height="3"/> <rect x="109" y="89" width="3" height="3"/> <rect x="91" y="92" width="3" height="3"/> <rect x="94" y="92" width="3" height="3"/> <rect x="97" y="92" width="3" height="3"/> <rect x="100" y="92" width="3" height="3"/> <rect x="103" y="92" width="3" height="3"/> <rect x="106" y="92" width="3" height="3"/> <rect x="94" y="95" width="3" height="3"/> <rect x="97" y="95" width="3" height="3"/> <rect x="100" y="95" width="3" height="3"/> <rect x="103" y="95" width="3" height="3"/> <rect x="97" y="98" width="3" height="3"/> <rect x="100" y="98" width="3" height="3"/> </g> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </svg>'
    },
    P03: {
      id: 'P03',
      en: 'Curious',
      cn: '好奇',
      note: '右倾 12° · 神情 = ?',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <g transform="rotate(12 100 130)"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="28" cy="125" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-30 28 110)"/> <ellipse cx="172" cy="125" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(30 172 110)"/> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- pixel ? --> <g fill="#F5F4F1"> <rect x="94" y="84" width="3" height="3"/> <rect x="97" y="84" width="3" height="3"/> <rect x="100" y="84" width="3" height="3"/> <rect x="103" y="84" width="3" height="3"/> <rect x="106" y="87" width="3" height="3"/> <rect x="103" y="90" width="3" height="3"/> <rect x="100" y="93" width="3" height="3"/> <rect x="100" y="96" width="3" height="3"/> <rect x="100" y="102" width="3" height="3"/> </g> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </g> </svg>'
    },
    P04: {
      id: 'P04',
      en: 'Aha',
      cn: '顿悟',
      note: '小跳 · 神情 = 灯泡',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <!-- body hopped up --> <g transform="translate(0 -10)"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- both arms thrown up --> <ellipse cx="30" cy="80" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-50 36 110)"/> <ellipse cx="170" cy="80" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(50 164 110)"/> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- pixel lightbulb: bulb top + base bottom --> <g fill="#F5F4F1"> <rect x="97" y="83" width="3" height="3"/> <rect x="100" y="83" width="3" height="3"/> <rect x="94" y="86" width="3" height="3"/> <rect x="103" y="86" width="3" height="3"/> <rect x="91" y="89" width="3" height="3"/> <rect x="106" y="89" width="3" height="3"/> <rect x="91" y="92" width="3" height="3"/> <rect x="106" y="92" width="3" height="3"/> <rect x="94" y="95" width="3" height="3"/> <rect x="103" y="95" width="3" height="3"/> <rect x="97" y="98" width="3" height="3"/> <rect x="100" y="98" width="3" height="3"/> <rect x="97" y="101" width="6" height="2"/> <rect x="97" y="104" width="6" height="2"/> </g> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </g> </svg>'
    },
    P05: {
      id: 'P05',
      en: 'Cheering',
      cn: '加油',
      note: 'V 形举手 · 神情 = !',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- V arms --> <ellipse cx="20" cy="80" rx="10" ry="22" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-45 36 110)"/> <ellipse cx="180" cy="80" rx="10" ry="22" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(45 164 110)"/> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- pixel ! --> <g fill="#F5F4F1"> <rect x="97" y="82" width="6" height="3"/> <rect x="97" y="85" width="6" height="3"/> <rect x="97" y="88" width="6" height="3"/> <rect x="97" y="91" width="6" height="3"/> <rect x="97" y="94" width="6" height="3"/> <rect x="97" y="101" width="6" height="6"/> </g> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </svg>'
    },
    P06: {
      id: 'P06',
      en: 'Thinking',
      cn: '思考',
      note: '左倾 12° · 神情 = ...',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <g transform="rotate(-12 100 130)"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="36" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- right arm bent up to "chin" --> <ellipse cx="148" cy="100" rx="10" ry="18" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(70 148 110)"/> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- pixel ... --> <g fill="#F5F4F1"> <rect x="89" y="93" width="5" height="5"/> <rect x="98" y="93" width="5" height="5"/> <rect x="107" y="93" width="5" height="5"/> </g> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </g> </svg>'
    },
    P07: {
      id: 'P07',
      en: 'Confused',
      cn: '困惑',
      note: '微塌 · 神情 = ?!',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <!-- body slightly squashed --> <ellipse cx="100" cy="120" rx="70" ry="76" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- arms hanging limp --> <ellipse cx="34" cy="145" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="166" cy="145" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <circle cx="100" cy="98" r="22" fill="#EA580C"/> <!-- pixel ?! --> <g fill="#F5F4F1"> <rect x="88" y="88" width="3" height="3"/> <rect x="91" y="88" width="3" height="3"/> <rect x="94" y="88" width="3" height="3"/> <rect x="97" y="91" width="3" height="3"/> <rect x="94" y="94" width="3" height="3"/> <rect x="91" y="97" width="3" height="3"/> <rect x="91" y="103" width="3" height="3"/> <rect x="106" y="88" width="4" height="14"/> <rect x="106" y="105" width="4" height="4"/> </g> <text x="100" y="150" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="210" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="210" rx="14" ry="7" fill="#1A1A1A"/> </svg>'
    },
    P08: {
      id: 'P08',
      en: 'Star',
      cn: '答对',
      note: '跳起 · 神情 = ★ · 答对用',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <g transform="translate(0 -18)"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="22" cy="75" rx="10" ry="22" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-55 36 108)"/> <ellipse cx="178" cy="75" rx="10" ry="22" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(55 164 108)"/> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- pixel star 4-point --> <polygon points="100,82 104,93 115,95 104,97 100,108 96,97 85,95 96,93" fill="#F5F4F1"/> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </g> <!-- motion lines below --> <g stroke="#EA580C" stroke-width="2.5" stroke-linecap="round" fill="none"> <line x1="78" y1="218" x2="74" y2="226"/> <line x1="100" y1="222" x2="100" y2="232"/> <line x1="122" y1="218" x2="126" y2="226"/> </g> </svg>'
    },
    P09: {
      id: 'P09',
      en: 'Pointing',
      cn: '指',
      note: '右手指向 · 神情 = →',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="36" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- right arm extended fully right (longer) --> <ellipse cx="190" cy="115" rx="22" ry="9" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- pixel arrow --> <g fill="#F5F4F1"> <rect x="89" y="92" width="3" height="6"/> <rect x="92" y="92" width="3" height="6"/> <rect x="95" y="92" width="3" height="6"/> <rect x="98" y="92" width="3" height="6"/> <rect x="101" y="92" width="3" height="6"/> <rect x="104" y="89" width="3" height="3"/> <rect x="107" y="92" width="3" height="3"/> <rect x="104" y="95" width="3" height="3"/> <rect x="107" y="95" width="3" height="3"/> <rect x="104" y="98" width="3" height="3"/> </g> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </svg>'
    },
    P10: {
      id: 'P10',
      en: 'Listening',
      cn: '聆听',
      note: '眼周白光晕 · 等输入',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="36" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="164" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- halo glow ring --> <circle cx="100" cy="95" r="28" fill="none" stroke="#F5F4F1" stroke-width="3" opacity="0.6"/> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <rect x="97" y="92" width="6" height="6" fill="#F5F4F1"/> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </svg>'
    },
    P11: {
      id: 'P11',
      en: 'Examining',
      cn: '看',
      note: '前倾 8° · 眼往下看',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <g transform="rotate(8 100 130)"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="30" cy="130" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(20 36 110)"/> <ellipse cx="170" cy="130" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-20 164 110)"/> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- dot at lower part of eye --> <rect x="97" y="106" width="6" height="6" fill="#F5F4F1"/> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </g> </svg>'
    },
    P12: {
      id: 'P12',
      en: 'Sleepy',
      cn: '想睡',
      note: '眼半闭 · 神情 = zZ',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="36" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="164" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- half-closed eye (squashed ellipse) --> <ellipse cx="100" cy="98" rx="22" ry="11" fill="#EA580C"/> <!-- pixel zZ --> <g fill="#F5F4F1"> <rect x="88" y="94" width="9" height="2"/> <rect x="94" y="96" width="3" height="2"/> <rect x="91" y="98" width="3" height="2"/> <rect x="88" y="100" width="9" height="2"/> <rect x="103" y="94" width="9" height="2"/> <rect x="109" y="96" width="3" height="2"/> <rect x="106" y="98" width="3" height="2"/> <rect x="103" y="100" width="9" height="2"/> </g> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </svg>'
    },
    P13: {
      id: 'P13',
      en: 'Goodbye',
      cn: '再见',
      note: '举高手 · 神情 = 心',
      svg: '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"> <ellipse cx="100" cy="115" rx="68" ry="80" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="36" cy="135" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- right arm raised very high --> <ellipse cx="178" cy="55" rx="10" ry="22" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(20 178 75)"/> <circle cx="100" cy="95" r="22" fill="#EA580C"/> <!-- pixel heart same as P02 --> <g fill="#F5F4F1"> <rect x="91" y="86" width="3" height="3"/> <rect x="94" y="86" width="3" height="3"/> <rect x="103" y="86" width="3" height="3"/> <rect x="106" y="86" width="3" height="3"/> <rect x="88" y="89" width="3" height="3"/> <rect x="91" y="89" width="3" height="3"/> <rect x="94" y="89" width="3" height="3"/> <rect x="97" y="89" width="3" height="3"/> <rect x="100" y="89" width="3" height="3"/> <rect x="103" y="89" width="3" height="3"/> <rect x="106" y="89" width="3" height="3"/> <rect x="109" y="89" width="3" height="3"/> <rect x="91" y="92" width="3" height="3"/> <rect x="94" y="92" width="3" height="3"/> <rect x="97" y="92" width="3" height="3"/> <rect x="100" y="92" width="3" height="3"/> <rect x="103" y="92" width="3" height="3"/> <rect x="106" y="92" width="3" height="3"/> <rect x="94" y="95" width="3" height="3"/> <rect x="97" y="95" width="3" height="3"/> <rect x="100" y="95" width="3" height="3"/> <rect x="103" y="95" width="3" height="3"/> <rect x="97" y="98" width="3" height="3"/> <rect x="100" y="98" width="3" height="3"/> </g> <text x="100" y="148" font-family="Fraunces, serif" font-size="13" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="82" cy="208" rx="14" ry="7" fill="#1A1A1A"/> <ellipse cx="118" cy="208" rx="14" ry="7" fill="#1A1A1A"/> </svg>'
    },
    P14: {
      id: 'P14',
      en: 'Team',
      cn: 'Professor Spark + 豆豆',
      note: '合影 · 豆豆 = Professor Spark 50% 高度',
      svg: '<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg"> <!-- Professor Spark (left, taller) --> <g transform="translate(40 30)"> <!-- antenna --> <line x1="100" y1="20" x2="100" y2="5" stroke="#EA580C" stroke-width="3"/> <circle cx="100" cy="4" r="5" fill="#EA580C"/> <!-- body (taller egg) --> <ellipse cx="100" cy="115" rx="72" ry="105" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- ear grilles (sides) --> <rect x="20" y="100" width="8" height="30" rx="3" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <rect x="172" y="100" width="8" height="30" rx="3" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- arms --> <ellipse cx="32" cy="155" rx="10" ry="22" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="168" cy="155" rx="10" ry="22" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <!-- square pixel eyes --> <rect x="78" y="78" width="18" height="18" fill="#EA580C"/> <rect x="104" y="78" width="18" height="18" fill="#EA580C"/> <rect x="89" y="89" width="4" height="4" fill="#1A1A1A"/> <rect x="115" y="89" width="4" height="4" fill="#1A1A1A"/> <rect x="85" y="82" width="3" height="3" fill="#F5F4F1"/> <rect x="111" y="82" width="3" height="3" fill="#F5F4F1"/> <!-- pixel smile --> <g fill="#EA580C"> <rect x="85" y="120" width="3" height="3"/> <rect x="88" y="123" width="3" height="3"/> <rect x="91" y="126" width="3" height="3"/> <rect x="94" y="128" width="12" height="3"/> <rect x="106" y="126" width="3" height="3"/> <rect x="109" y="123" width="3" height="3"/> <rect x="112" y="120" width="3" height="3"/> </g> <!-- P badge --> <text x="100" y="180" font-family="Fraunces, serif" font-size="22" font-weight="500" fill="#EA580C" text-anchor="middle">P</text> <!-- feet --> <ellipse cx="80" cy="235" rx="16" ry="8" fill="#1A1A1A"/> <ellipse cx="120" cy="235" rx="16" ry="8" fill="#1A1A1A"/> </g> <!-- DouDou (right, smaller, ~50% height of P) --> <g transform="translate(250 130)"> <ellipse cx="50" cy="60" rx="42" ry="50" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="8" cy="75" rx="7" ry="14" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="92" cy="75" rx="7" ry="14" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <circle cx="50" cy="46" r="14" fill="#EA580C"/> <rect x="48" y="44" width="4" height="4" fill="#F5F4F1"/> <text x="50" y="80" font-family="Fraunces, serif" font-size="9" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="38" cy="118" rx="9" ry="5" fill="#1A1A1A"/> <ellipse cx="62" cy="118" rx="9" ry="5" fill="#1A1A1A"/> </g> </svg>'
    },
    P15: {
      id: 'P15',
      en: 'Level Up',
      cn: '两豆豆同跳',
      note: 'Level up popup · 两豆豆同跳 · 都是 ★ 眼',
      svg: '<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg"> <!-- doudou 1 (left) --> <g transform="translate(50 30)"> <ellipse cx="80" cy="100" rx="58" ry="68" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="14" cy="60" rx="9" ry="18" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-50 22 96)"/> <ellipse cx="146" cy="60" rx="9" ry="18" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(50 138 96)"/> <circle cx="80" cy="84" r="18" fill="#EA580C"/> <polygon points="80,74 83,82 92,84 83,86 80,94 77,86 68,84 77,82" fill="#F5F4F1"/> <text x="80" y="128" font-family="Fraunces, serif" font-size="11" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="64" cy="178" rx="12" ry="6" fill="#1A1A1A"/> <ellipse cx="96" cy="178" rx="12" ry="6" fill="#1A1A1A"/> <g stroke="#EA580C" stroke-width="2" stroke-linecap="round" fill="none"> <line x1="62" y1="190" x2="58" y2="198"/> <line x1="80" y1="194" x2="80" y2="202"/> <line x1="98" y1="190" x2="102" y2="198"/> </g> </g> <!-- doudou 2 (right) --> <g transform="translate(220 30)"> <ellipse cx="80" cy="100" rx="58" ry="68" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="14" cy="60" rx="9" ry="18" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-50 22 96)"/> <ellipse cx="146" cy="60" rx="9" ry="18" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(50 138 96)"/> <circle cx="80" cy="84" r="18" fill="#EA580C"/> <polygon points="80,74 83,82 92,84 83,86 80,94 77,86 68,84 77,82" fill="#F5F4F1"/> <text x="80" y="128" font-family="Fraunces, serif" font-size="11" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="64" cy="178" rx="12" ry="6" fill="#1A1A1A"/> <ellipse cx="96" cy="178" rx="12" ry="6" fill="#1A1A1A"/> <g stroke="#EA580C" stroke-width="2" stroke-linecap="round" fill="none"> <line x1="62" y1="190" x2="58" y2="198"/> <line x1="80" y1="194" x2="80" y2="202"/> <line x1="98" y1="190" x2="102" y2="198"/> </g> </g> </svg>'
    },
    P16: {
      id: 'P16',
      en: 'Lesson Complete',
      cn: '三豆豆庆祝',
      note: 'Lesson 完成 popup · 中间大豆豆 + 两边小豆豆 · 全跳 + 全 ★ 眼',
      svg: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg"> <!-- doudou left (smaller, behind) --> <g transform="translate(20 70)"> <ellipse cx="60" cy="80" rx="45" ry="54" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="8" cy="50" rx="7" ry="14" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-50 14 76)"/> <ellipse cx="112" cy="50" rx="7" ry="14" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(50 106 76)"/> <circle cx="60" cy="65" r="14" fill="#EA580C"/> <polygon points="60,57 63,63 70,65 63,67 60,73 57,67 50,65 57,63" fill="#F5F4F1"/> <text x="60" y="100" font-family="Fraunces, serif" font-size="9" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="48" cy="140" rx="9" ry="5" fill="#1A1A1A"/> <ellipse cx="72" cy="140" rx="9" ry="5" fill="#1A1A1A"/> <g stroke="#EA580C" stroke-width="1.5" stroke-linecap="round" fill="none"> <line x1="48" y1="150" x2="44" y2="158"/> <line x1="60" y1="154" x2="60" y2="162"/> <line x1="72" y1="150" x2="76" y2="158"/> </g> </g> <!-- doudou center (bigger, in front) --> <g transform="translate(170 20)"> <ellipse cx="80" cy="100" rx="62" ry="74" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="10" cy="58" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-55 18 96)"/> <ellipse cx="150" cy="58" rx="10" ry="20" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(55 142 96)"/> <circle cx="80" cy="82" r="20" fill="#EA580C"/> <polygon points="80,70 84,80 94,82 84,84 80,94 76,84 66,82 76,80" fill="#F5F4F1"/> <text x="80" y="128" font-family="Fraunces, serif" font-size="12" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="63" cy="190" rx="13" ry="7" fill="#1A1A1A"/> <ellipse cx="97" cy="190" rx="13" ry="7" fill="#1A1A1A"/> <g stroke="#EA580C" stroke-width="2.5" stroke-linecap="round" fill="none"> <line x1="60" y1="204" x2="56" y2="214"/> <line x1="80" y1="208" x2="80" y2="218"/> <line x1="100" y1="204" x2="104" y2="214"/> </g> </g> <!-- doudou right (smaller, behind) --> <g transform="translate(360 70)"> <ellipse cx="60" cy="80" rx="45" ry="54" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5"/> <ellipse cx="8" cy="50" rx="7" ry="14" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(-50 14 76)"/> <ellipse cx="112" cy="50" rx="7" ry="14" fill="#F5F4F1" stroke="#E8E2D8" stroke-width="1.5" transform="rotate(50 106 76)"/> <circle cx="60" cy="65" r="14" fill="#EA580C"/> <polygon points="60,57 63,63 70,65 63,67 60,73 57,67 50,65 57,63" fill="#F5F4F1"/> <text x="60" y="100" font-family="Fraunces, serif" font-size="9" font-weight="500" fill="#EA580C" text-anchor="middle">豆</text> <ellipse cx="48" cy="140" rx="9" ry="5" fill="#1A1A1A"/> <ellipse cx="72" cy="140" rx="9" ry="5" fill="#1A1A1A"/> <g stroke="#EA580C" stroke-width="1.5" stroke-linecap="round" fill="none"> <line x1="48" y1="150" x2="44" y2="158"/> <line x1="60" y1="154" x2="60" y2="162"/> <line x1="72" y1="150" x2="76" y2="158"/> </g> </g> </svg>'
    },
  };

  var MOOD_TO_POSE = {
    default:    'P01',
    idle:       'P01',
    start:      'P02',
    greeting:   'P02',
    curious:    'P03',
    aha:        'P04',
    cheer:      'P05',
    encourage:  'P05',
    think:      'P06',
    hint:       'P06',
    confused:   'P07',
    wrong:      'P07',
    correct:    'P08',
    right:      'P08',
    star:       'P08',
    point:      'P09',
    listen:     'P10',
    tts:        'P10',
    examine:    'P11',
    read:       'P11',
    sleepy:     'P12',
    goodbye:    'P13',
    wrap:       'P13',
    team:       'P14',
    levelup:    'P15',
    streak:     'P15',
    complete:   'P16',
    transition: 'P01',
    happy:      'P08',
    thinking:   'P06'
  };

  function renderDoudou(moodOrPoseId, opts) {
    opts = opts || {};
    var poseId = (moodOrPoseId && /^P\d+$/.test(moodOrPoseId))
      ? moodOrPoseId
      : (MOOD_TO_POSE[moodOrPoseId] || 'P01');
    var pose = POSES[poseId] || POSES.P01;
    var size = opts.size || 120;
    var extra = opts.className ? (' ' + opts.className) : '';
    return '<div class="doudou-pose' + extra + '" data-pose="' + poseId +
           '" data-mood="' + (moodOrPoseId || 'default') +
           '" style="width:' + size + 'px;height:auto;display:inline-block;line-height:0">'
           + pose.svg + '</div>';
  }

  window.DoudouPoses  = POSES;
  window.MoodToPose   = MOOD_TO_POSE;
  window.renderDoudou = renderDoudou;
})();
