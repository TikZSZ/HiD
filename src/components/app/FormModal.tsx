import React from "react"
import
{
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";

export const FormModal: React.FC<{ children: React.ReactElement, isModalOpen: boolean, setIsModalOpen: ( val: boolean ) => void,title:string }> = ( { children, isModalOpen, setIsModalOpen ,title} ) =>
{
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent aria-describedby="Key Creation Form">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}