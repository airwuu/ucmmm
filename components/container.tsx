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
const container: React.FC<containerProps> = ({pavMenuItems,pavTime="",dcMenuItems,dcTime=""}) => {
  return (
      <ScrollShadow className="h-full scrollbar-hide flex snap-mandatory snap-x overflow-x-auto w-full px-36 gap-3 py-2">
        <MainCard location="Pavilion" items={pavMenuItems} text={pavTime}/>
        <MainCard location="YWDC" items={dcMenuItems} text={dcTime}/>
        <MainCard location="Food Trucks (WIP)" items={dcMenuItems} text=""/>
      </ScrollShadow>
  )
}

export default container