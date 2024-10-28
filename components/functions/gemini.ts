require('dotenv').config()
export default async function gemini(prompt="") {
    const instruction = "Remove all the stuff in parentheses, simplify this text into a succint list separated by commas. Split items that use `or` into two." 
    try{
    const API_KEY= process.env.GEMINI_KEY

    const {
        GoogleGenerativeAI,
        HarmCategory,
        HarmBlockThreshold,
    } = require("@google/generative-ai");

    const apiKey = process.env.GEMINI_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: instruction,
    });
    
    const generationConfig = {
    temperature: 1.8,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 200,
    responseMimeType: "text/plain",
    };

    // console.log("i ran")
    let result = await model.generateContent(prompt);
    let resultText = await result.response.text(); 
    // console.log(resultText)
  
    return (resultText);
  }
  catch{
    console.log("gemini prompt failed")
  }
}