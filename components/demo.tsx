import React from 'react'
import Container from './container'
import {pavMenuGroupTime, formatTimePAV, fetchMenu, formatTimeDC, dcMenuGroupTime} from "@/components/functions/menuAPI"
import gemini from "@/components/functions/gemini"

const Demo = async () => {
  // const date = new Date("October 17, 2024 13:13:00")
  const date = new Date()
  let menuParams = formatTimePAV(date);
  const pavData = await fetchMenu(0, menuParams[0], menuParams[1]);
  const pavMenuItems = pavData.data.menuItems.map((item: any) => ({
    name: (item.name + " " +  (item.description.includes(":") ? item.description.match(/^[^:]+/)[0] : "")),
    // description: gemini(item.description.replace(/^[^:]*:\s*/, ""))
    description: item.description.replace(/^[^:]*:\s*/, "")
  }));
  menuParams = formatTimeDC(date);
  const dcData = await fetchMenu(1, menuParams[0], menuParams[1]);
  const dcMenuItems = dcData.data.menuItems.map((item: any) => ({
    name: (item.name + " " +  (item.description.includes(":") ? item.description.match(/^[^:]+/)[0] : "")),
    description: item.description.replace(/^[^:]*:\s*/, "")
  }));

  console.log("yes: "+pavMenuGroupTime(date))
  return (
    <Container 
      pavMenuItems={pavMenuItems} 
      pavTime={pavMenuGroupTime(date)}
      dcMenuItems={dcMenuItems}
      dcTime={dcMenuGroupTime(date)}>
    </Container>
  )
}

export default Demo