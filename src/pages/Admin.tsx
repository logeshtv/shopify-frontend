import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Settings,
  Shield,
  Key,
  Mail,
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Crown,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { supabase } from "../lib/supabaseClient";

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [addError, setAddError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [subuserLimit, setSubuserLimit] = useState(5);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const fetchSubUsers = async (userId: string) => {
    const { data: subUsersData } = await supabase
      .from("sub_users")
      .select("id, name, email, role, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true });
    setSubUsers(subUsersData || []);
  };

  // Fetch roles and initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const userType = localStorage.getItem("user_type");
      if (userType !== "admin") {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      const email = localStorage.getItem("user_email");
      if (!email) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, subuser_limit")
        .eq("email", email)
        .single();

      if (userError || !user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setAdminId(user.id);
      setSubuserLimit(user.subuser_limit || 5);
      await fetchSubUsers(user.id);

      const { data: rolesData } = await supabase
        .from("roles")
        .select("name, permissions");
      setRoles(rolesData || []);

      setIsAuthorized(true);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddSubUser = async (e: FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.name || !addForm.email || !addForm.password || !addForm.role) {
      setAddError("All fields are required");
      return;
    }
    if (subUsers.length >= subuserLimit) {
      setAddError(`You can only add up to ${subuserLimit} sub-users.`);
      return;
    }

    try {
      // Use Supabase Auth to create the user, which handles hashing securely
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: {
          data: {
            name: addForm.name,
            role: addForm.role,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      // If auth user is created, add to our custom sub_users table
      if (authData.user && adminId) {
        const { error: insertError } = await supabase.from("sub_users").insert([
          {
            owner_id: adminId,
            name: addForm.name,
            email: addForm.email,
            role: addForm.role,
            // Do NOT store password_hash here from client-side
          },
        ]);

        if (insertError) {
          // If this fails, we should ideally delete the user from auth.users
          // For now, just show the error
          throw insertError;
        }
      }

      setShowAddModal(false);
      setAddForm({ name: "", email: "", password: "", role: "" });
      if (adminId) {
        await fetchSubUsers(adminId);
      }
    } catch (error: any) {
      setAddError(error.message);
    }
  };

  const handleDeleteSubUser = async (id: string) => {
    // Note: This only deletes from sub_users, not from auth.users.
    // A more robust solution would involve a server-side function.
    await supabase.from("sub_users").delete().eq("id", id);
    setSubUsers(subUsers.filter((u) => u.id !== id));
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "analyst":
        return "bg-green-100 text-green-800 border-green-200";
      case "viewer":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredUsers = subUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Unauthorized</h2>
          <p className="text-slate-700 mb-4">
            You do not have permission to view this page.
          </p>
          <Button onClick={() => (window.location.href = "/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Admin Panel
            </h1>
            <p className="text-slate-600">
              Manage users, permissions, and system settings
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600"
              onClick={() => setShowAddModal(true)}
              disabled={subUsers.length >= subuserLimit}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
        {/* Add Sub-User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Sub-User</h2>
              {addError && (
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
                  {addError}
                </div>
              )}
              <form onSubmit={handleAddSubUser} className="space-y-4">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    Name
                  </label>
                  <Input
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={addForm.email}
                    onChange={(e) =>
                      setAddForm({ ...addForm, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm({ ...addForm, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    Role
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    value={addForm.role}
                    onChange={(e) =>
                      setAddForm({ ...addForm, role: e.target.value })
                    }
                    required
                  >
                    <option value="">Select role</option>
                    {roles.map((role: any) => (
                      <option key={role.name} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  >
                    Add
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {subUsers.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Active Sessions</p>
                  <p className="text-2xl font-bold text-slate-900">23</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Admin Users</p>
                  <p className="text-2xl font-bold text-slate-900">3</p>
                </div>
                <Crown className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Security Alerts</p>
                  <p className="text-2xl font-bold text-slate-900">2</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="users" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          </TabsList>
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Users ({filteredUsers.length})
                </CardTitle>
                <CardDescription>
                  Manage user accounts and access levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {user.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-slate-900">
                            {user.name}
                          </h3>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          {user.email}
                        </p>
                        <p className="text-xs text-slate-500">
                          Created: {user.created_at?.slice(0, 10)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="h-5 w-5 mr-2 text-green-600" />
                    Role Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Admin</h4>
                        <Badge className="bg-purple-100 text-purple-800">
                          Full Access
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        Complete system access and user management
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Manager</h4>
                        <Badge className="bg-blue-100 text-blue-800">
                          Advanced
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        Product management, reports, and team oversight
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Analyst</h4>
                        <Badge className="bg-green-100 text-green-800">
                          Standard
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        Data analysis and compliance monitoring
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Viewer</h4>
                        <Badge className="bg-gray-100 text-gray-800">
                          Read Only
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        View-only access to products and reports
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Permission Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-2 text-xs font-medium text-slate-600 border-b pb-2">
                      <div>Permission</div>
                      <div>Admin</div>
                      <div>Manager</div>
                      <div>Analyst</div>
                      <div>Viewer</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-5 gap-2 items-center">
                        <div>User Management</div>
                        <div>✓</div>
                        <div>-</div>
                        <div>-</div>
                        <div>-</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 items-center">
                        <div>Product Management</div>
                        <div>✓</div>
                        <div>✓</div>
                        <div>-</div>
                        <div>-</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 items-center">
                        <div>HS Code Detection</div>
                        <div>✓</div>
                        <div>✓</div>
                        <div>✓</div>
                        <div>-</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 items-center">
                        <div>View Reports</div>
                        <div>✓</div>
                        <div>✓</div>
                        <div>✓</div>
                        <div>✓</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 items-center">
                        <div>Billing Access</div>
                        <div>✓</div>
                        <div>-</div>
                        <div>-</div>
                        <div>-</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* systemSettings.map((section) => (
              <Card key={section.category} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-purple-600" />
                    {section.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.settings.map((setting, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900">{setting.name}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600">{setting.value}</span>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )) */}
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  System audit logs and user activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Badge className={getLogStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">{log.action}</h4>
                          <p className="text-xs text-slate-600">by {log.user} • {log.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.ip}
                      </div>
                    </div>
                  )) */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
