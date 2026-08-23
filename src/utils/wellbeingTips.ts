import type { LanguageCode } from '../contexts/LanguageContext.js';

interface WellbeingTip {
  en: string;
  ta: string;
}

const tips: WellbeingTip[] = [
  { en: 'Start the day with one realistic priority instead of a long pressure-filled list.', ta: 'நீண்ட பட்டியலுக்கு பதிலாக இன்று செய்ய வேண்டிய ஒரு நடைமுறை முன்னுரிமையைத் தேர்ந்தெடுத்து நாளைத் தொடங்குங்கள்.' },
  { en: 'Take a short screen break and look at something far away for a minute.', ta: 'ஒரு நிமிடம் திரையிலிருந்து விலகி தூரத்தில் உள்ள ஒன்றைப் பாருங்கள்.' },
  { en: 'Drink some water and notice whether tiredness is making concentration harder.', ta: 'சிறிது தண்ணீர் குடித்து, சோர்வு கவனத்தை பாதிக்கிறதா என்று கவனியுங்கள்.' },
  { en: 'Break one difficult task into the smallest next step you can finish in ten minutes.', ta: 'கடினமான ஒரு பணியை பத்து நிமிடங்களில் முடிக்கக்கூடிய சிறிய அடுத்த படியாகப் பிரியுங்கள்.' },
  { en: 'Write down one thing that went well today, even if it was small.', ta: 'இன்று நன்றாக நடந்த ஒரு சிறிய விஷயமாவது எழுதிப் பாருங்கள்.' },
  { en: 'If your mind feels crowded, write your thoughts down before deciding what needs action.', ta: 'மனம் நிறைந்ததாக தோன்றினால், எதைச் செய்ய வேண்டும் என்று முடிவெடுக்கும் முன் எண்ணங்களை எழுதுங்கள்.' },
  { en: 'Stretch your shoulders, neck and hands after a long study session.', ta: 'நீண்ட நேரம் படித்த பிறகு தோள்கள், கழுத்து மற்றும் கைகளை மெதுவாக நீட்டுங்கள்.' },
  { en: 'Give yourself a clear stopping time for study and a clear time for rest.', ta: 'படிப்பை நிறுத்தும் நேரத்தையும் ஓய்வு நேரத்தையும் தெளிவாக நிர்ணயியுங்கள்.' },
  { en: 'When a task feels too big, ask: “What is the next useful action?”', ta: 'ஒரு வேலை மிகப் பெரியதாக தோன்றினால், “அடுத்த பயனுள்ள செயல் என்ன?” என்று கேளுங்கள்.' },
  { en: 'Spend a few minutes in daylight or fresh air when your energy feels low.', ta: 'ஆற்றல் குறைவாக இருக்கும் போது சில நிமிடங்கள் வெளிச்சம் அல்லது புதிய காற்றில் இருங்கள்.' },
  { en: 'Notice one thing you can control today and give less attention to what you cannot.', ta: 'இன்று நீங்கள் கட்டுப்படுத்தக்கூடிய ஒரு விஷயத்தை கவனித்து, கட்டுப்படுத்த முடியாதவற்றில் குறைவாக கவனம் செலுத்துங்கள்.' },
  { en: 'Keep your phone away for one focused 20-minute study block.', ta: '20 நிமிட கவனமான படிப்பு நேரத்திற்கு உங்கள் தொலைபேசியைத் தூரத்தில் வையுங்கள்.' },
  { en: 'If you feel overwhelmed, slow down and choose only one task to begin with.', ta: 'மிகுந்த அழுத்தமாக உணர்ந்தால் வேகத்தை குறைத்து ஒரு வேலை மட்டும் தொடங்குங்கள்.' },
  { en: 'A short walk can help create a mental reset between two demanding tasks.', ta: 'இரண்டு கடினமான பணிகளுக்கு இடையில் ஒரு குறுகிய நடை மனதை புதுப்பிக்க உதவும்.' },
  { en: 'Try to keep sleep and wake times reasonably consistent through the week.', ta: 'வாரம் முழுவதும் தூக்க நேரமும் எழும் நேரமும் சீராக இருக்க முயற்சிக்கவும்.' },
  { en: 'Speak to yourself with the same patience you would offer a close friend.', ta: 'நெருங்கிய நண்பரிடம் பேசும் பொறுமையுடன் உங்களிடமும் பேசுங்கள்.' },
  { en: 'Before reacting to a stressful message, give yourself a few minutes to settle.', ta: 'அழுத்தமான செய்திக்கு பதிலளிக்கும் முன் சில நிமிடங்கள் அமைதியாகுங்கள்.' },
  { en: 'Keep one small enjoyable activity in your day, not only work and study.', ta: 'வேலை மற்றும் படிப்பு மட்டும் இல்லாமல், தினமும் ஒரு சிறிய மகிழ்ச்சியான செயலுக்கு நேரம் வையுங்கள்.' },
  { en: 'If concentration drops, change posture, location or task for a short while.', ta: 'கவனம் குறைந்தால் உட்காரும் முறை, இடம் அல்லது பணியை சிறிது நேரம் மாற்றிப் பாருங்கள்.' },
  { en: 'Ask for clarification early when an academic task is confusing.', ta: 'படிப்பு தொடர்பான வேலை குழப்பமாக இருந்தால் ஆரம்பத்திலேயே விளக்கம் கேளுங்கள்.' },
  { en: 'Keep meals and study breaks regular when possible; long gaps can affect energy.', ta: 'முடிந்தவரை உணவும் படிப்பு இடைவெளிகளும் சீராக இருக்கட்டும்; நீண்ட இடைவெளிகள் ஆற்றலை பாதிக்கலாம்.' },
  { en: 'List three things that genuinely need attention and ignore the rest for now.', ta: 'உண்மையில் கவனம் தேவைப்படும் மூன்று விஷயங்களை மட்டும் பட்டியலிட்டு மற்றவற்றை இப்போது விடுங்கள்.' },
  { en: 'Use a gentle reminder instead of self-criticism when you fall behind.', ta: 'பின்னடைந்தால் உங்களை விமர்சிப்பதற்குப் பதிலாக மெதுவான நினைவூட்டலைப் பயன்படுத்துங்கள்.' },
  { en: 'A few slow breaths before a presentation can help you focus on the next sentence.', ta: 'வழங்கலுக்கு முன் சில மெதுவான மூச்சுகள் அடுத்த வாக்கியத்தில் கவனம் செலுத்த உதவும்.' },
  { en: 'Make space for a trusted conversation when something has been on your mind for days.', ta: 'பல நாட்களாக மனதில் இருக்கும் விஷயத்தை நம்பகமான ஒருவருடன் பகிர நேரம் ஒதுக்குங்கள்.' },
  { en: 'Keep your study area simple enough that starting a task feels easy.', ta: 'வேலை தொடங்க எளிதாக இருக்கும் அளவுக்கு உங்கள் படிப்பு இடத்தை எளிமையாக வைத்திருங்கள்.' },
  { en: 'Celebrate finishing a small step; progress does not need to look dramatic.', ta: 'ஒரு சிறிய படியை முடித்ததையும் பாராட்டுங்கள்; முன்னேற்றம் எப்போதும் பெரியதாகத் தோன்ற வேண்டியதில்லை.' },
  { en: 'If you are tired, reduce task difficulty before increasing pressure on yourself.', ta: 'சோர்வாக இருந்தால் உங்கள்மீது அழுத்தத்தை அதிகரிப்பதற்கு முன் பணியின் சிரமத்தை குறையுங்கள்.' },
  { en: 'End the day by writing tomorrow’s first task so you do not carry it in your head overnight.', ta: 'நாளை முதலில் செய்ய வேண்டிய பணியை எழுதிவிட்டு நாளை முடிக்கவும்; அதை இரவு முழுவதும் மனதில் வைத்திருக்க வேண்டாம்.' },
  { en: 'If a difficult feeling keeps interfering with daily life, consider talking with a trusted person or available support service.', ta: 'ஒரு கடினமான உணர்வு தினசரி வாழ்க்கையை தொடர்ந்து பாதித்தால், நம்பகமான ஒருவரோ கிடைக்கும் ஆதரவு சேவையோடு பேசுவது உதவியாக இருக்கலாம்.' },
];

const dayNumber = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
};

export function getDailyWellbeingTip(
  language: LanguageCode,
  date = new Date(),
) {
  const index = dayNumber(date) % tips.length;
  return {
    index,
    total: tips.length,
    text: tips[index][language],
  };
}

export const WELLBEING_TIP_COUNT = tips.length;
