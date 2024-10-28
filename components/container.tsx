"use client"
import React from 'react'
import MainCard from './mainCard';
import {ScrollShadow} from "@nextui-org/react";

interface containerProps{
    pavMenuItems: any;
    dcMenuItems: any;
}
const container: React.FC<containerProps> = ({pavMenuItems,dcMenuItems}) => {
  return (
      <ScrollShadow className="h-full scrollbar-hide flex snap-mandatory snap-x overflow-x-auto w-full px-36 gap-3 py-2">
        <MainCard location="Pavilion" items={pavMenuItems}/>
        <MainCard location="YWDC" items={dcMenuItems}/>
        <MainCard location="Food Trucks (WIP)" items={dcMenuItems}/>
      </ScrollShadow>
  )
}

export default container