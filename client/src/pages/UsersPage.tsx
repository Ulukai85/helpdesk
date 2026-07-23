import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserFormDialog from "@/components/UserFormDialog";
import UsersTable from "@/components/UsersTable";

export default function UsersPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Users</h1>
        <Button onClick={() => setShowCreate(true)}>Create User</Button>
      </div>
      <UserFormDialog open={showCreate} onOpenChange={setShowCreate} />
      <UsersTable />
    </div>
  );
}
