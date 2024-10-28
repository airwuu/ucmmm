"use client"
import React from 'react'
import MainCard from './mainCard';
import {ScrollShadow} from "@nextui-org/react";

interface containerProps{
    pavMenuItems: any;
    pavTime: any;
    dcMenuItems: any;
    dcTime: any;
}
const container: React.FC<containerProps> = ({pavMenuItems,pavTime="",dcMenuItems, dcTime=""}) => {
  return (
    // <ScrollShadow hideScrollBar className="overflow-hidden flex flex-col items-center justify-center gap-4 py-2 md:py-4">
    //   <div className="overflow-hidden inline-block max-w-xl md:max-w-full text-center justify-center"> 
        
    //   </div> 
    // </ScrollShadow>
    <section className="h-full flex flex-col items-center justify-center gap-4 py-2 md:py-4">
      <div className="h-full inline-block max-w-xl md:max-w-full text-center justify-center">
        <ScrollShadow size={20} hideScrollBar visibility="bottom" className="h-full overflow-auto">
          <div className="flex snap-mandatory snap-x overflow-x-auto w-full px-36 gap-3 py-2 overflow-y-auto">
                <MainCard location="Pavilion" items={pavMenuItems} text={pavTime}/>
                <MainCard location="YWDC" items={dcMenuItems} text={dcTime}/>
                <MainCard location="Food Trucks (WIP)" items={dcMenuItems} text=""/>
          </div>
        </ScrollShadow>
      </div>
    </section>
  )
}

export default container