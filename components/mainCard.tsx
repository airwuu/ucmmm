"use client"
import * as React from 'react'
import {Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@nextui-org/react";
interface MainCardProps{
    location: string;
    items: any;
}

const MainCard: React.FC<MainCardProps> = ({location, items}) => {
  return (
    <Card className="snap-center shrink-0 w-[300px] rounded-lg max-w-[300px] pl-5 pr-5 pt-3 pb-3 flex flex-col">
        <h1 className="text-2xl text-[#F38BA8] mb-1">{location}</h1>
        <ul>
            {items.map((item:any, index:any) => (
            <li key={index}>
                <div className="text-sm">
                    <strong>{item.name}</strong> <br />
                    <p className="text-[#9b9ea1]">{item.description}</p>
                </div>
            </li>
            ))}
        </ul>
    <Dropdown backdrop="blur">
      <DropdownTrigger>
        <Button 
          variant="bordered" 
        >
          Open Menu
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions">
        <DropdownItem key="new">New file</DropdownItem>
        <DropdownItem key="copy">Copy link</DropdownItem>
        <DropdownItem key="edit">Edit file</DropdownItem>
        <DropdownItem key="delete" className="text-danger" color="danger">
          Delete file
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
    </Card>
  )
}

export default MainCard