import React from 'react'
import Item from "@/components/item"
import {Divider} from "@nextui-org/react";
interface descriptionProps{
    description: string;
}
const description: React.FC<descriptionProps> = ({description}) => {
  let string = String(description)
  const items = string // this is a really dumb way to parse the menu (case insensitive)
  .replace(/\s*\(.*?\)\s*/g, ' ')  // remove content in parentheses
  .replace(/:/g, ' ')      //destroy colons
  .replace(/;/g, ' ') 
  // remove verbose langauge >:C
  .replace(/\bProtein\b/gi, ' ')    
  .replace(/\bChoice\b/gi, ' ')    
  .replace(/\bOf\b/gi, ' ')    
  .replace(/\bServed\b/gi, ' ')
  .replace(/\bSides\b/gi, ' ')       
  .replace(/\bOption\b/gi, ' ')       
  .replace(/\bOptions\b/gi, ' ')    
  .replace(/\bCome\b/gi, ' ')    
  .replace(/\bComes\b/gi, ' ') 
  .replace(/\bMeal\b/gi, ' ')  
  .replace(/\bMindful\b/gi, ' ')     
  //split these into different items   
  .replace(/\bOn a\b/gi, ',')  
  .replace(/\bthe day\b/gi, ',')  
  .replace(/\bOn\b/gi, ',')  
  .replace(/\bOr\b/gi, ',')       
  .replace(/\bAnd\b/gi, ',')       
  .replace(/&/g, ',')  //&
  .replace(/\bWith\b/gi, ',')     
  .replace(/\bIn\b/gi, ',')      
  .replace(/w\//g, ',')    //  w/
  
  // format string for further use  
  .replace(/\. /g, ",") // i cant believe they also typo , as . 
  .split(',')
  .map((item: string) => item.trim()) //remove whitepsace
  .map((item: string) => item.trim().replace(/\.$/, '')) //remove trailing periods
  .filter((item: string) => item !== ''); //remove empty items
//   console.log(items)
  return (
    <div className="flex flex-wrap gap-1 pt-2">
    {items.map((item: any, index: any) => (
        <Item key={index} name={item}/>
      ))}
    
    </div>
  )
}

export default description