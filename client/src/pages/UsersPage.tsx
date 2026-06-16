import { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateUserDialog from "@/components/CreateUserDialog";
import UsersTable from "@/components/UsersTable";

export default function UsersPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setShowCreate(true)}>Create User</Button>
      </div>
      <CreateUserDialog open={showCreate} onOpenChange={setShowCreate} />
      <UsersTable />
    </div>
  );
}
