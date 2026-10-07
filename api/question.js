const fallbackQuestions = [
{question:"Which planet is known as the Red Planet?",choices:["Venus","Mars","Jupiter","Mercury"],answer:1,explanation:"Mars appears red because of iron oxide on its surface."},
{question:"What is the largest planet in our Solar System?",choices:["Earth","Saturn","Jupiter","Neptune"],answer:2,explanation:"Jupiter is the largest planet in the Solar System."},
{question:"Which gas do humans need for cellular respiration?",choices:["Oxygen","Nitrogen","Hydrogen","Carbon dioxide"],answer:0,explanation:"Cells use oxygen during aerobic cellular respiration."},
{question:"What is H2O?",choices:["Oxygen","Hydrogen","Water","Salt"],answer:2,explanation:"H2O is the chemical formula for water."},
{question:"What force pulls objects toward Earth?",choices:["Friction","Gravity","Magnetism","Electricity"],answer:1,explanation:"Gravity attracts objects toward the center of Earth."},
{question:"What is the basic unit of life?",choices:["Atom","Cell","Tissue","Organ"],answer:1,explanation:"The cell is the basic structural and functional unit of life."},
{question:"Which organ pumps blood around the human body?",choices:["Brain","Heart","Lungs","Kidney"],answer:1,explanation:"The heart pumps blood throughout the circulatory system."},
{question:"What is the closest star to Earth?",choices:["Sirius","Polaris","The Sun","Betelgeuse"],answer:2,explanation:"The Sun is the closest star to Earth."},
{question:"Which organelle is known as the powerhouse of the cell?",choices:["Nucleus","Ribosome","Mitochondrion","Vacuole"],answer:2,explanation:"Mitochondria produce much of the cell's usable energy."},
{question:"What process allows plants to make food using sunlight?",choices:["Respiration","Photosynthesis","Digestion","Fermentation"],answer:1,explanation:"Photosynthesis converts light energy into chemical energy."},
{question:"Which particle has a negative charge?",choices:["Proton","Neutron","Electron","Nucleus"],answer:2,explanation:"Electrons have a negative electric charge."},
{question:"What is the chemical symbol for gold?",choices:["Ag","Au","Gd","Go"],answer:1,explanation:"Gold has the chemical symbol Au."},
{question:"Which planet is closest to the Sun?",choices:["Venus","Earth","Mercury","Mars"],answer:2,explanation:"Mercury is the closest planet to the Sun."},
{question:"What instrument measures temperature?",choices:["Barometer","Thermometer","Ammeter","Voltmeter"],answer:1,explanation:"A thermometer measures temperature."},
{question:"Which blood cells help fight infections?",choices:["Red blood cells","White blood cells","Platelets","Plasma"],answer:1,explanation:"White blood cells help the immune system fight infections."},
{question:"What is the boiling point of water at sea level?",choices:["50°C","75°C","100°C","150°C"],answer:2,explanation:"Water boils at 100°C at standard atmospheric pressure."},
{question:"Which layer of Earth do humans live on?",choices:["Mantle","Crust","Outer Core","Inner Core"],answer:1,explanation:"Humans live on Earth's crust."},
{question:"What type of energy does a moving object have?",choices:["Potential","Chemical","Kinetic","Nuclear"],answer:2,explanation:"Kinetic energy is the energy of motion."},
{question:"Which gas makes up most of Earth's atmosphere?",choices:["Oxygen","Nitrogen","Carbon dioxide","Hydrogen"],answer:1,explanation:"Nitrogen makes up about 78% of Earth's atmosphere."},
{question:"What is the natural satellite of Earth?",choices:["Mars","The Moon","Venus","Titan"],answer:1,explanation:"The Moon is Earth's natural satellite."}
];

function randomQuestion(){
 const q=fallbackQuestions[Math.floor(Math.random()*fallbackQuestions.length)];
 return {...q,source:"fallback"};
}

export default async function handler(req,res){

 if(req.method!=="GET")
  return res.status(405).json({error:"Method not allowed"});

 const apiKey=process.env.GEMINI_API_KEY;

 if(!apiKey)
  return res.status(200).json(randomQuestion());

 const topics=[
  "physics","chemistry","biology","astronomy",
  "space","Earth science","human biology",
  "animals","environment","technology","general science"
 ];

 const topic=topics[Math.floor(Math.random()*topics.length)];

 const prompt=`
Create ONE random ${topic} multiple-choice science question.

Difficulty: easy to medium.
Exactly 4 choices.
Only ONE correct answer.

Return ONLY JSON:
{
 "question":"string",
 "choices":["string","string","string","string"],
 "answer":0,
 "explanation":"short explanation"
}

answer must be 0, 1, 2, or 3.
`;

 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),5000);

 try{

  const response=await fetch(
   "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key="+encodeURIComponent(apiKey),
   {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    signal:controller.signal,
    body:JSON.stringify({
     contents:[{parts:[{text:prompt}]}],
     generationConfig:{
      temperature:1,
      maxOutputTokens:300,
      responseMimeType:"application/json"
     }
    })
   }
  );

  clearTimeout(timeout);

  if(!response.ok)
   return res.status(200).json(randomQuestion());

  const data=await response.json();

  const text=data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if(!text)
   return res.status(200).json(randomQuestion());

  let quiz;

  try{
   quiz=JSON.parse(text);
  }catch{
   return res.status(200).json(randomQuestion());
  }

  if(
   typeof quiz.question!=="string" ||
   !Array.isArray(quiz.choices) ||
   quiz.choices.length!==4 ||
   !Number.isInteger(quiz.answer) ||
   quiz.answer<0 ||
   quiz.answer>3
  ){
   return res.status(200).json(randomQuestion());
  }

  return res.status(200).json({
   question:quiz.question,
   choices:quiz.choices,
   answer:quiz.answer,
   explanation:quiz.explanation||"That's the correct answer!",
   source:"ai"
  });

 }catch(error){

  clearTimeout(timeout);

  return res.status(200).json(randomQuestion());
 }
}
