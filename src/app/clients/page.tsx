"use client";
export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { type Client, type Content } from "@/lib/types";
import { PlusCircle, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
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
import { useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getClients, addClient, updateClient, deleteClient } from "@/services/clientService";
import { getContent } from "@/services/contentService";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [contentList, setContentList] = React.useState<Content[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Client; direction: 'ascending' | 'descending' } | null>(null);
  const [clientNotes, setClientNotes] = React.useState<Record<string, string>>({});
  const [selectedContentItem, setSelectedContentItem] = React.useState<Content | null>(null);
  const [isContentViewOpen, setIsContentViewOpen] = React.useState(false);
  const [defaultDate, setDefaultDate] = React.useState('');

  const { toast } = useToast();

  React.useEffect(() => {
    setDefaultDate(new Date().toLocaleDateString('en-CA'));
    async function fetchData() {
      setIsLoading(true);
      try {
        const [clientsData, contentData] = await Promise.all([
          getClients(),
          getContent(),
        ]);
        setClients(clientsData);
        setContentList(contentData);
        // Initialize notes from documentation field
        const notes: Record<string, string> = {};
        clientsData.forEach((client) => {
          notes[client.id] = client.documentation || '';
        });
        setClientNotes(notes);
      } catch (error) {
        toast({
          title: "Error fetching data",
          description: "Could not load data from the database.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData().catch((err) => {
      setIsLoading(false);
      toast({
        title: "Unexpected error",
        description: err?.message || String(err),
        variant: "destructive"
      });
    });
  }, [toast]);


  // Debounce update to Supabase
  const debounceTimeout = useRef<Record<string, NodeJS.Timeout>>({});
  const handleNoteChange = (clientId: string, note: string) => {
    setClientNotes((prevNotes) => ({
      ...prevNotes,
      [clientId]: note,
    }));
    // Debounce update to Supabase
    if (debounceTimeout.current[clientId]) {
      clearTimeout(debounceTimeout.current[clientId]);
    }
    debounceTimeout.current[clientId] = setTimeout(async () => {
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        try {
          await updateClient({ ...client, documentation: note });
        } catch (error) {
          toast({ title: "Error", description: "Could not save documentation.", variant: "destructive" });
        }
      }
    }, 600);
  };

  const sortedClients = React.useMemo(() => {
    let sortableItems = [...clients];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
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
  }, [clients, sortConfig]);

  const requestSort = (key: keyof Client) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof Client) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newClientData: Omit<Client, 'id'> = {
      name: formData.get("name") as string,
      contactPerson: formData.get("contactPerson") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      status: formData.get("status") as Client["status"],
      joinDate: formData.get("joinDate") as string,
      monthlyVideos: parseInt(formData.get("monthlyVideos") as string, 10) || 0,
    };

    try {
        const newClient = await addClient(newClientData);
        setClients((prevClients) => [newClient, ...prevClients]);
        setIsAddOpen(false);
        toast({ title: "Success", description: "Client added successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Could not add client.", variant: "destructive" });
    }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClient) return;

    const formData = new FormData(event.currentTarget);
    const updatedClient: Client = {
      ...selectedClient,
      name: formData.get("name") as string,
      contactPerson: formData.get("contactPerson") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      status: formData.get("status") as Client["status"],
      monthlyVideos: parseInt(formData.get("monthlyVideos") as string, 10) || 0,
      joinDate: formData.get("joinDate") as string,
    };
    
    try {
        await updateClient(updatedClient);
        setClients(clients.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
        setIsEditOpen(false);
        toast({ title: "Success", description: "Client updated successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Could not update client.", variant: "destructive" });
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    try {
        await deleteClient(selectedClient.id);
        setClients(clients.filter((c) => c.id !== selectedClient.id));
        setIsDeleteAlertOpen(false);
        toast({
          title: "Client Deleted",
          description: `${selectedClient.name} has been removed.`,
        });
    } catch (error) {
         toast({ title: "Error", description: "Could not delete client.", variant: "destructive" });
    }
  };

  const getStatusBadgeClassName = (status: 'To Do' | 'In Progress' | 'In Review' | 'Done') => {
    switch (status) {
      case 'Done':
        return 'bg-green-500/20 text-green-700 border-green-500/20 hover:bg-green-500/30';
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/20 hover:bg-blue-500/30';
      case 'In Review':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/30';
      case 'To Do':
         return 'bg-gray-500/20 text-gray-700 border-gray-500/20 hover:bg-gray-500/30';
      default:
        return '';
    }
  };
  
  const clientStatusBadge = (status: Client['status']) => {
    return (
        <Badge
            variant={
                status === "Active"
                ? "default"
                : status === "Lead"
                ? "secondary"
                : "outline"
            }
            className={
                status === "Active"
                ? "bg-green-500/20 text-green-700 border-green-500/20 hover:bg-green-500/30"
                : ""
            }
        >
            {status}
        </Badge>
    );
  }

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client accounts and information.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client List</CardTitle>
            <CardDescription>
              A list of all clients in your agency.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('name')}>
                        Client Name
                        {getSortIcon('name')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('status')}>
                        Status
                        {getSortIcon('status')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('contactPerson')}>
                        Contact Person
                        {getSortIcon('contactPerson')}
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button variant="ghost" onClick={() => requestSort('email')}>
                        Email
                        {getSortIcon('email')}
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button variant="ghost" onClick={() => requestSort('phone')}>
                        Phone
                        {getSortIcon('phone')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('monthlyVideos')}>
                        Monthly Videos
                        {getSortIcon('monthlyVideos')}
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button variant="ghost" onClick={() => requestSort('joinDate')}>
                        Join Date
                        {getSortIcon('joinDate')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : sortedClients.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                            No clients found. Try seeding the database from the Settings page.
                        </TableCell>
                    </TableRow>
                  ) : (
                    sortedClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          {clientStatusBadge(client.status)}
                        </TableCell>
                        <TableCell>{client.contactPerson}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {client.email}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {client.phone}
                        </TableCell>
                        <TableCell>{client.monthlyVideos}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {client.joinDate}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedClient(client);
                                  setIsEditOpen(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedClient(client);
                                  setIsViewOpen(true);
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onSelect={() => {
                                  setSelectedClient(client);
                                  setIsDeleteAlertOpen(true);
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                    Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                    ))
                ) : sortedClients.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 rounded-lg border-2 border-dashed">
                        <p>No clients found.</p>
                    </div>
                ) : (
                    sortedClients.map((client) => (
                    <Card key={client.id}>
                        <CardContent className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{client.name}</p>
                                <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
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
                                    <DropdownMenuItem onSelect={() => { setSelectedClient(client); setIsEditOpen(true); }}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setSelectedClient(client); setIsViewOpen(true); }}>View Details</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedClient(client); setIsDeleteAlertOpen(true); }}>
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            {clientStatusBadge(client.status)}
                            <div className="text-muted-foreground">
                                <span className="font-medium">{client.monthlyVideos}</span> videos/mo
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                    ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Client-specific notes and documentation. Select a client to view
              or edit their notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || sortedClients.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                <p>
                  {isLoading ? 'Loading client documentation...' : 'No clients available to document. Add a client to get started.'}
                </p>
              </div>
            ) : (
              <Tabs defaultValue={sortedClients[0].id} className="w-full">
                <TabsList className="h-auto flex-wrap justify-start">
                  {sortedClients.map((client) => (
                    <TabsTrigger key={client.id} value={client.id}>
                      {client.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {sortedClients.map((client) => (
                  <TabsContent key={client.id} value={client.id}>
                    <Textarea
                      placeholder={`Notes for ${client.name}...`}
                      className="mt-4 h-48 resize-none"
                      value={clientNotes[client.id] || ""}
                      onChange={(e) =>
                        handleNoteChange(client.id, e.target.value)
                      }
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Client Content</CardTitle>
            <CardDescription>
              Content pipeline for each client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || sortedClients.length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                    <p>
                        {isLoading ? 'Loading client content...' : 'No clients available to view content for.'}
                    </p>
                </div>
            ) : (
              <Tabs defaultValue={sortedClients[0].id} className="w-full">
                <TabsList className="h-auto flex-wrap justify-start">
                  {sortedClients.map((client) => (
                    <TabsTrigger key={client.id} value={client.id}>
                      {client.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {sortedClients.map((client) => {
                  const clientContent = contentList.filter(c => c.client === client.name);
                  return (
                    <TabsContent key={client.id} value={client.id} className="mt-4">
                      {clientContent.length > 0 ? (
                         <div>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                               <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Link</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {clientContent.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-medium">{item.title}</TableCell>
                                      <TableCell>
                                        <Badge variant={'outline'} className={cn(getStatusBadgeClassName(item.status))}>
                                          {item.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{item.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : ''}</TableCell>
                                      <TableCell>{item.owner}</TableCell>
                                      <TableCell>
                                        {item.link ? (
                                          <Button asChild variant="ghost" size="icon">
                                            <Link href={item.link} target="_blank">
                                              <ExternalLink className="h-4 w-4" />
                                            </Link>
                                          </Button>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              aria-haspopup="true"
                                              size="icon"
                                              variant="ghost"
                                            >
                                              <MoreHorizontal className="h-4 w-4" />
                                              <span className="sr-only">Toggle menu</span>
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem
                                              onSelect={() => {
                                                setSelectedContentItem(item);
                                                setIsContentViewOpen(true);
                                              }}
                                            >
                                              View Details
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            {/* Mobile Card List */}
                            <div className="md:hidden space-y-4">
                               {clientContent.map((item) => (
                                 <Card key={item.id}>
                                   <CardContent className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                      <p className="font-semibold">{item.title}</p>
                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                              <MoreHorizontal className="h-4 w-4" />
                                              <span className="sr-only">Toggle menu</span>
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem
                                              onSelect={() => {
                                                setSelectedContentItem(item);
                                                setIsContentViewOpen(true);
                                              }}
                                            >
                                              View Details
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <Badge variant={'outline'} className={cn(getStatusBadgeClassName(item.status))}>
                                        {item.status}
                                      </Badge>
                                      <div className="text-muted-foreground">
                                          {item.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : ''}
                                      </div>
                                    </div>
                                   </CardContent>
                                 </Card>
                               ))}
                            </div>
                         </div>
                      ) : (
                        <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                          <p>No content for {client.name}.</p>
                        </div>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Fill in the details for the new client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactPerson" className="text-right">
                  Contact
                </Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="monthlyVideos" className="text-right">
                  Monthly Videos
                </Label>
                <Input
                  id="monthlyVideos"
                  name="monthlyVideos"
                  type="number"
                  defaultValue={0}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="joinDate" className="text-right">
                  Join Date
                </Label>
                <Input
                  id="joinDate"
                  name="joinDate"
                  type="date"
                  defaultValue={defaultDate}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select name="status" defaultValue="Lead">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Add Client</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClient?.name}</DialogTitle>
            <DialogDescription>
              Client since {selectedClient?.joinDate}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-muted-foreground">Contact Person</Label>
                <p className="col-span-2 font-medium">
                  {selectedClient.contactPerson}
                </p>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-muted-foreground">Email</Label>
                <p className="col-span-2 font-medium">{selectedClient.email}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-muted-foreground">Phone</Label>
                <p className="col-span-2 font-medium">{selectedClient.phone}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-muted-foreground">Monthly Videos</Label>
                <p className="col-span-2 font-medium">
                  {selectedClient.monthlyVideos}
                </p>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-muted-foreground">Status</Label>
                <div className="col-span-2">
                  <Badge
                    variant={
                      selectedClient.status === "Active"
                        ? "default"
                        : selectedClient.status === "Lead"
                        ? "secondary"
                        : "outline"
                    }
                    className={
                      selectedClient.status === "Active"
                        ? "bg-green-500/20 text-green-700 border-green-500/20 hover:bg-green-500/30"
                        : ""
                    }
                  >
                    {selectedClient.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Make changes to the client's profile. Click save when you're
              done.
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedClient.name}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contactPerson" className="text-right">
                    Contact
                  </Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    defaultValue={selectedClient.contactPerson}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={selectedClient.email}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={selectedClient.phone}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="monthlyVideos" className="text-right">
                    Monthly Videos
                  </Label>
                  <Input
                    id="monthlyVideos"
                    name="monthlyVideos"
                    type="number"
                    defaultValue={selectedClient.monthlyVideos}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="joinDate" className="text-right">
                    Join Date
                  </Label>
                  <Input
                    id="joinDate"
                    name="joinDate"
                    type="date"
                    defaultValue={selectedClient.joinDate}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select name="status" defaultValue={selectedClient.status}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Client Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              client data for "{selectedClient?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteClient}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Content Dialog */}
      <Dialog open={isContentViewOpen} onOpenChange={setIsContentViewOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>{selectedContentItem?.title}</DialogTitle>
            <DialogDescription>
                Content for {selectedContentItem?.client}
            </DialogDescription>
            </DialogHeader>
            {selectedContentItem && (
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-3 items-center gap-2">
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="col-span-2">
                        <Badge variant={'outline'} className={cn(getStatusBadgeClassName(selectedContentItem.status))}>
                            {selectedContentItem.status}
                        </Badge>
                    </div>
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                    <Label className="text-muted-foreground">Deadline</Label>
                    <p className="col-span-2 font-medium">{selectedContentItem.deadline ? new Date(selectedContentItem.deadline).toISOString().slice(0, 10) : ''}</p>
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                    <Label className="text-muted-foreground">Owner</Label>
                    <p className="col-span-2 font-medium">{selectedContentItem.owner}</p>
                </div>
                {selectedContentItem.description && (
                    <div className="grid grid-cols-3 items-start gap-2">
                        <Label className="text-muted-foreground">Description</Label>
                        <p className="col-span-2 font-medium whitespace-pre-wrap">{selectedContentItem.description}</p>
                    </div>
                )}
                {selectedContentItem.link && (
                    <div className="grid grid-cols-3 items-center gap-2">
                        <Label className="text-muted-foreground">Link</Label>
                        <Button asChild variant="link" size="sm" className="p-0 h-auto justify-start col-span-2">
                            <Link href={selectedContentItem.link} target="_blank" className="truncate">
                                {selectedContentItem.link}
                                <ExternalLink className="h-3 w-3 ml-1.5" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
            )}
            <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                Close
                </Button>
            </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
