"use client";
export const dynamic = "force-dynamic";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type TeamMember, type Client } from "@/lib/types";
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { listenToTeamMembers, deleteTeamMember } from "@/services/teamService";
import { getClients } from "@/services/clientService";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

type SortableTeamKeys = keyof Omit<TeamMember, 'hourlyRate'>;

export default function TeamPage() {
  const [team, setTeam] = React.useState<TeamMember[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableTeamKeys; direction: 'ascending' | 'descending' } | null>(null);
  const [clientsForEdit, setClientsForEdit] = React.useState<string[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchClients() {
      try {
        const clientData = await getClients();
        setClients(clientData);
      } catch (error) {
        toast({
          title: "Error fetching clients",
          description: "Could not load client data.",
          variant: "destructive"
        });
      }
    }

    fetchClients();

    // Förbättrad patch: Använd alltid värdet från DB om det finns, annars fallback
    const unsubscribeTeam = listenToTeamMembers((teamDataRaw: any[]) => {
      const teamData = teamDataRaw.map((member) => {
        let assignedClients = [];
        if (Array.isArray(member.assignedClients) && member.assignedClients.length > 0) {
          assignedClients = member.assignedClients;
        } else if (Array.isArray(member.assignedclients) && member.assignedclients.length > 0) {
          assignedClients = member.assignedclients;
        } else if (Array.isArray(member.assignedClients)) {
          assignedClients = member.assignedClients;
        } else if (Array.isArray(member.assignedclients)) {
          assignedClients = member.assignedclients;
        }
        return {
          ...member,
          assignedClients,
        };
      });
      setTeam(teamData);
      setIsLoading(false);
    });

    return () => unsubscribeTeam();
  }, [toast]);


  const sortedTeam = React.useMemo(() => {
    let sortableItems = [...team];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number | string[] | undefined = a[sortConfig.key];
        let bValue: string | number | string[] | undefined = b[sortConfig.key];
  
        if (sortConfig.key === 'assignedClients') {
          aValue = (a.assignedClients ?? []).length;
          bValue = (b.assignedClients ?? []).length;
        }
  
        // Hantera undefined innan jämförelse
        if (aValue === undefined || bValue === undefined) {
          return 0; // Jämför ej om någon sida saknar värde
        }
  
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [team, sortConfig]);

  const requestSort = (key: SortableTeamKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortableTeamKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const handleClientSelectionChange = (clientName: string, checked: boolean | 'indeterminate') => {
    if (checked) {
        setClientsForEdit(prev => [...prev, clientName]);
    } else {
        setClientsForEdit(prev => prev.filter(name => name !== clientName));
    }
  };
  
  // Uppdatering av team-medlemmar är borttagen. All redigering sker direkt i Supabase.

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    try {
        await deleteTeamMember(selectedMember.id);
        setTeam(team.filter((m) => m.id !== selectedMember.id));
        setIsDeleteAlertOpen(false);
        toast({
          title: "Team Member Deleted",
          description: `${selectedMember.name} has been removed.`,
        });
    } catch (error) {
         toast({ title: "Error", description: "Could not delete team member.", variant: "destructive" });
    }
  };

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            En översikt på alla i teamet på BrandGuys!
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          {/* <CardTitle>Team Members</CardTitle>
          <CardDescription>
            An overview of all team members in your agency.
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                      Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('email')}>
                      Email
                      {getSortIcon('email')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('phone')}>
                      Phone
                      {getSortIcon('phone')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('role')}>
                      Role
                      {getSortIcon('role')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('assignedClients')}>
                      Assigned Clients
                      {getSortIcon('assignedClients')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedTeam.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                          No team members found. New members are added when they sign up.
                      </TableCell>
                  </TableRow>
                ) : (
                  sortedTeam.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {member.email}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {member.phone}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {member.assignedClients.map((clientName) => (
                            <Badge key={clientName} variant="secondary">
                              {clientName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => { setSelectedMember(member); setClientsForEdit(member.assignedClients); setIsEditOpen(true); }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedMember(member); setIsDeleteAlertOpen(true); }}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu> */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Card List */}
          <div className="md:hidden">
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                ))
              ) : sortedTeam.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 rounded-lg border-2 border-dashed">
                      <p>No team members found.</p>
                  </div>
              ) : (
                sortedTeam.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => { setSelectedMember(member); setClientsForEdit(member.assignedClients); setIsEditOpen(true); }}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedMember(member); setIsDeleteAlertOpen(true); }}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                      {member.assignedClients.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Assigned Clients</p>
                            <div className="flex flex-wrap gap-1">
                                {member.assignedClients.map((clientName) => (
                                <Badge key={clientName} variant="secondary" className="text-xs">
                                    {clientName}
                                </Badge>
                                ))}
                            </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open: boolean) => { setIsEditOpen(open); if(!open) setSelectedMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Make changes to the team member's profile.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <form>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" name="name" defaultValue={selectedMember.name} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={selectedMember.email} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={selectedMember.phone} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                   <Select name="role" defaultValue={selectedMember.role}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ägare">Ägare</SelectItem>
                        <SelectItem value="Kreatör">Kreatör</SelectItem>
                        <SelectItem value="Ekonomi">Ekonomi</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Clients</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="col-span-3 justify-start text-left font-normal h-auto min-h-10">
                        <div className="flex flex-wrap gap-1">
                          {clientsForEdit.length > 0 ? (
                            clientsForEdit.map(clientName => (
                                <Badge key={clientName} variant="secondary">{clientName}</Badge>
                            ))
                          ) : (
                            "Select clients"
                          )}
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <div className="flex flex-col gap-1 p-2">
                        {clients.map((client) => (
                          <Label
                            key={client.id}
                            className="flex items-center gap-2 font-normal p-2 rounded-md hover:bg-muted"
                          >
                            <Checkbox
                              id={`client-edit-${client.id}`}
                              checked={clientsForEdit.includes(client.name)}
                              onCheckedChange={(checked: boolean | 'indeterminate') => handleClientSelectionChange(client.name, checked)}
                            />
                            {client.name}
                          </Label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team member "{selectedMember?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteMember}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppShell>
  );
}
