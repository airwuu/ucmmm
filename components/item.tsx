"use client"
import React from 'react'
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@nextui-org/react";
interface itemProps{
    name: any;
    reports: any;
}
const item: React.FC<itemProps> = ({name, reports}) => {
  return (
    <Dropdown backdrop="blur">
      <DropdownTrigger>
        <Button 
          variant="solid" 
          size="sm"
          className=" text-md font-light max-w-[230px]"
          style={{ wordBreak: 'break-all' }}
        >
          {name}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions" disabledKeys={["name", "reports"]}>
        <DropdownItem key="name"><b>{name}</b></DropdownItem>
        <DropdownItem key="reports">Reports: {reports}</DropdownItem>
        <DropdownItem key="delete" className="text-danger" color="danger">
          Report Missing
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

export default item