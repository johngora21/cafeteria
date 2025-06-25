"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Settings,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { collection, getDocs, addDoc, QueryDocumentSnapshot, DocumentData, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  ready: boolean
}

interface Category {
  id: string
  name: string
  description: string
  active: boolean
}

interface Cashier {
  id: string
  name: string
  email: string
  phone: string
  shift: string
  active: boolean
  joinDate: string
}

export default function AdminDashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [cashiers, setCashiers] = useState<Cashier[] | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddCashier, setShowAddCashier] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null)

  // Form states
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  })
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  })
  const [cashierForm, setCashierForm] = useState({
    name: "",
    email: "",
    phone: "",
    shift: "",
  })

  const [orders, setOrders] = useState<any[] | null>(null)

  useEffect(() => {
    // Real-time menuItems
    const unsubMenu = onSnapshot(
      collection(db, "menuItems"),
      (snapshot) => {
        console.log("menuItems snapshot", snapshot.docs.length);
        setMenuItems(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as MenuItem)
          )
        );
      }
    );
    // Real-time categories
    const unsubCat = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        setCategories(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Category)
          )
        );
      }
    );
    // Real-time cashiers
    const unsubCash = onSnapshot(
      collection(db, "cashiers"),
      (snapshot) => {
        setCashiers(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Cashier)
          )
        );
      }
    );
    // Add real-time orders listener
    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        setOrders(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() })
          )
        );
      }
    );
    return () => {
      unsubMenu();
      unsubCat();
      unsubCash();
      unsubOrders();
    };
  }, []);

  const resetItemForm = () => {
    setItemForm({ name: "", description: "", price: "", category: "" })
    setEditingItem(null)
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "" })
    setEditingCategory(null)
  }

  const resetCashierForm = () => {
    setCashierForm({ name: "", email: "", phone: "", shift: "" })
    setEditingCashier(null)
  }

  const handleAddItem = async () => {
    console.log("handleAddItem called");
    const newItem = {
      name: itemForm.name,
      description: itemForm.description,
      price: Number.parseInt(itemForm.price),
      category: itemForm.category,
      ready: true,
    };
    await addDoc(collection(db, "menuItems"), newItem);
    resetItemForm();
    setShowAddItem(false);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
    })
    setShowAddItem(true)
  }

  const handleUpdateItem = async () => {
    if (editingItem) {
      try {
        await updateDoc(doc(db, "menuItems", editingItem.id), {
          name: itemForm.name,
          description: itemForm.description,
          price: Number.parseInt(itemForm.price),
          category: itemForm.category,
        });
        resetItemForm();
        setShowAddItem(false);
      } catch (error) {
        console.error("Error updating menu item:", error);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "menuItems", id));
    } catch (error) {
      console.error("Error deleting menu item:", error);
    }
  }

  const handleAddCategory = async () => {
    const newCategory = {
      name: categoryForm.name,
      description: categoryForm.description,
      active: true,
    };
    await addDoc(collection(db, "categories"), newCategory);
    resetCategoryForm();
    setShowAddCategory(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description,
    })
    setShowAddCategory(true)
  }

  const handleUpdateCategory = async () => {
    if (editingCategory) {
      try {
        await updateDoc(doc(db, "categories", editingCategory.id), {
          name: categoryForm.name,
          description: categoryForm.description,
        });
        resetCategoryForm();
        setShowAddCategory(false);
      } catch (error) {
        console.error("Error updating category:", error);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  }

  const toggleCategoryStatus = async (id: string) => {
    if (!categories) return;
    const category = categories.find(cat => cat.id === id);
    if (category) {
      try {
        await updateDoc(doc(db, "categories", id), {
          active: !category.active
        });
      } catch (error) {
        console.error("Error toggling category status:", error);
      }
    }
  }

  const handleAddCashier = async () => {
    const newCashier = {
      name: cashierForm.name,
      email: cashierForm.email,
      phone: cashierForm.phone,
      shift: cashierForm.shift,
      active: true,
      joinDate: new Date().toISOString().split("T")[0],
    };
    await addDoc(collection(db, "cashiers"), newCashier);
    resetCashierForm();
    setShowAddCashier(false);
  };

  const handleEditCashier = (cashier: Cashier) => {
    setEditingCashier(cashier)
    setCashierForm({
      name: cashier.name,
      email: cashier.email,
      phone: cashier.phone,
      shift: cashier.shift,
    })
    setShowAddCashier(true)
  }

  const handleUpdateCashier = async () => {
    if (editingCashier) {
      try {
        await updateDoc(doc(db, "cashiers", editingCashier.id), {
          name: cashierForm.name,
          email: cashierForm.email,
          phone: cashierForm.phone,
          shift: cashierForm.shift,
        });
        resetCashierForm();
        setShowAddCashier(false);
      } catch (error) {
        console.error("Error updating cashier:", error);
      }
    }
  };

  const toggleCashierStatus = async (id: string) => {
    if (!cashiers) return;
    const cashier = cashiers.find(c => c.id === id);
    if (cashier) {
      try {
        await updateDoc(doc(db, "cashiers", id), {
          active: !cashier.active
        });
      } catch (error) {
        console.error("Error toggling cashier status:", error);
      }
    }
  }

  async function addMenuItem(data: Omit<MenuItem, "id">) {
    await addDoc(collection(db, "menuItems"), data);
  }

  if (menuItems === null || categories === null || cashiers === null) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-lg font-medium text-gray-900">Super Admin Dashboard</h1>
            </div>
            <Badge className="bg-red-500 text-xs">Admin Access</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 h-8">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="menu" className="text-xs">
              Menu Items
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">
              Categories
            </TabsTrigger>
            <TabsTrigger value="cashiers" className="text-xs">
              Cashiers
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">{orders ? orders.length : 0}</div>
                  <p className="text-[10px] text-muted-foreground">+12% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">TSh {orders ? orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString() : 0}</div>
                  <p className="text-[10px] text-muted-foreground">+8% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Active Cashiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">{cashiers.filter((c) => c.active).length}</div>
                  <p className="text-[10px] text-muted-foreground">Out of {cashiers.length} total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Menu Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">{menuItems.length}</div>
                  <p className="text-[10px] text-muted-foreground">{categories.length} categories</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium">Menu Items Management</h2>
              <Button onClick={() => setShowAddItem(true)} size="sm" className="h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {menuItems?.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex justify-between items-center p-3">
                    <div>
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-600">
                        {item.category} • TSh {item.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.ready ? "default" : "secondary"} className="text-[10px]">
                        {item.ready ? "Available" : "Unavailable"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleEditItem(item)} className="h-7 w-7 p-0">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium">Categories Management</h2>
              <Button onClick={() => setShowAddCategory(true)} size="sm" className="h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add Category
              </Button>
            </div>
            <div className="grid gap-3">
              {categories?.map((category) => (
                <Card key={category.id}>
                  <CardContent className="flex justify-between items-center p-3">
                    <div>
                      <h3 className="font-medium text-sm">{category.name}</h3>
                      <p className="text-xs text-gray-600">{category.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={category.active ? "default" : "secondary"} className="text-[10px]">
                        {category.active ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={category.active}
                        onCheckedChange={() => toggleCategoryStatus(category.id)}
                        className="scale-75"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cashiers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium">Cashier Management</h2>
              <Button onClick={() => setShowAddCashier(true)} size="sm" className="h-8 text-xs">
                <UserPlus className="w-3 h-3 mr-1" />
                Add Cashier
              </Button>
            </div>
            <div className="grid gap-3">
              {cashiers?.map((cashier) => (
                <Card key={cashier.id}>
                  <CardContent className="flex justify-between items-center p-3">
                    <div>
                      <h3 className="font-medium text-sm">{cashier.name}</h3>
                      <p className="text-xs text-gray-600">
                        {cashier.email} • {cashier.phone}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cashier.shift} Shift • Joined {cashier.joinDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={cashier.active ? "default" : "secondary"} className="text-[10px]">
                        {cashier.active ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={cashier.active}
                        onCheckedChange={() => toggleCashierStatus(cashier.id)}
                        className="scale-75"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCashier(cashier)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  System Settings
                </CardTitle>
                <CardDescription className="text-sm">Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Mobile Money Providers</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">M-Pesa</span>
                        <Switch defaultChecked className="scale-75" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Airtel Money</span>
                        <Switch defaultChecked className="scale-75" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tigo Pesa</span>
                        <Switch defaultChecked className="scale-75" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Halo Pesa</span>
                        <Switch defaultChecked className="scale-75" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Order Settings</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-confirm orders</span>
                        <Switch defaultChecked className="scale-75" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SMS notifications</span>
                        <Switch className="scale-75" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email receipts</span>
                        <Switch defaultChecked className="scale-75" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingItem ? "Update the menu item details" : "Add a new item to the menu"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="item-name" className="text-xs">
                Item Name
              </Label>
              <Input
                id="item-name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="item-description" className="text-xs">
                Description
              </Label>
              <Textarea
                id="item-description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="item-price" className="text-xs">
                Price (TSh)
              </Label>
              <Input
                id="item-price"
                type="number"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="item-category" className="text-xs">
                Category
              </Label>
              <Select
                value={itemForm.category}
                onValueChange={(value) => setItemForm({ ...itemForm, category: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddItem(false)
                resetItemForm()
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={editingItem ? handleUpdateItem : handleAddItem}
              disabled={!itemForm.name || !itemForm.price || !itemForm.category}
              className="text-xs"
            >
              {editingItem ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingCategory ? "Update the category details" : "Add a new category to organize menu items"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="category-name" className="text-xs">
                Category Name
              </Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="category-description" className="text-xs">
                Description
              </Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCategory(false)
                resetCategoryForm()
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
              disabled={!categoryForm.name}
              className="text-xs"
            >
              {editingCategory ? "Update" : "Add"} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Cashier Dialog */}
      <Dialog open={showAddCashier} onOpenChange={setShowAddCashier}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingCashier ? "Edit Cashier" : "Add New Cashier"}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingCashier ? "Update the cashier details" : "Add a new cashier to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cashier-name" className="text-xs">
                Full Name
              </Label>
              <Input
                id="cashier-name"
                value={cashierForm.name}
                onChange={(e) => setCashierForm({ ...cashierForm, name: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cashier-email" className="text-xs">
                Email
              </Label>
              <Input
                id="cashier-email"
                type="email"
                value={cashierForm.email}
                onChange={(e) => setCashierForm({ ...cashierForm, email: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cashier-phone" className="text-xs">
                Phone Number
              </Label>
              <Input
                id="cashier-phone"
                value={cashierForm.phone}
                onChange={(e) => setCashierForm({ ...cashierForm, phone: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cashier-shift" className="text-xs">
                Shift
              </Label>
              <Select
                value={cashierForm.shift}
                onValueChange={(value) => setCashierForm({ ...cashierForm, shift: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning (6:00 AM - 2:00 PM)</SelectItem>
                  <SelectItem value="Afternoon">Afternoon (2:00 PM - 10:00 PM)</SelectItem>
                  <SelectItem value="Evening">Evening (10:00 PM - 6:00 AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCashier(false)
                resetCashierForm()
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={editingCashier ? handleUpdateCashier : handleAddCashier}
              disabled={!cashierForm.name || !cashierForm.email || !cashierForm.phone || !cashierForm.shift}
              className="text-xs"
            >
              {editingCashier ? "Update" : "Add"} Cashier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
