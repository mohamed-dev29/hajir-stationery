import { useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useProducts, useCategories } from "@/hooks/useDatabase";
import { toast } from "sonner";
import type { Product, Category } from "@/types";

type TabType = "products" | "categories";

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, addCategory, updateCategory, deleteCategory } =
    useCategories();
  const [tab, setTab] = useState<TabType>("products");
  const [search, setSearch] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "product" | "category";
    id: string;
  } | null>(null);

  // Product form state
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pCost, setPCost] = useState("");
  const [pStock, setPStock] = useState("");
  const [pBarcode, setPBarcode] = useState("");
  const [pImage, setPImage] = useState("");

  // Category form state
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search),
  );

  const openProductForm = (product?: Product) => {
    if (product) {
      setEditProduct(product);
      setPName(product.name);
      setPDesc(product.description);
      setPCategory(product.categoryId);
      setPPrice(product.price.toString());
      setPCost(product.costPrice.toString());
      setPStock(product.stock.toString());
      setPBarcode(product.barcode);
      setPImage(product.image || "");
    } else {
      setEditProduct(null);
      setPName("");
      setPDesc("");
      setPCategory(categories[0]?.id || "");
      setPPrice("");
      setPCost("");
      setPStock("");
      setPBarcode("");
      setPImage("");
    }
    setShowProductForm(true);
  };

  const openCategoryForm = (category?: Category) => {
    if (category) {
      setEditCategory(category);
      setCName(category.name);
      setCDesc(category.description);
    } else {
      setEditCategory(null);
      setCName("");
      setCDesc("");
    }
    setShowCategoryForm(true);
  };

  const saveProduct = () => {
    if (!pName || !pPrice || !pStock) {
      toast.error("Name, price, and stock are required");
      return;
    }
    const data = {
      name: pName,
      description: pDesc,
      categoryId: pCategory,
      price: parseFloat(pPrice),
      costPrice: parseFloat(pCost) || 0,
      stock: parseInt(pStock),
      barcode: pBarcode,
      image: pImage,
    };
    if (editProduct) {
      updateProduct(editProduct.id, data);
      toast.success("Product updated");
    } else {
      addProduct(data);
      toast.success("Product added");
    }
    setShowProductForm(false);
  };

  const saveCategory = () => {
    if (!cName) {
      toast.error("Category name is required");
      return;
    }
    if (editCategory) {
      updateCategory(editCategory.id, { name: cName, description: cDesc });
      toast.success("Category updated");
    } else {
      addCategory({ name: cName, description: cDesc });
      toast.success("Category added");
    }
    setShowCategoryForm(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "product") {
      deleteProduct(deleteTarget.id);
      toast.success("Product deleted");
    } else {
      deleteCategory(deleteTarget.id);
      toast.success("Category deleted");
    }
    setDeleteTarget(null);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 2,
    }).format(v);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product catalog and categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={tab === "products" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("products")}
            className={
              tab === "products" ? "bg-[#2D6A4F] hover:bg-[#1B4D3E]" : ""
            }
          >
            <Package className="w-4 h-4 mr-1" />
            Products
          </Button>
          <Button
            variant={tab === "categories" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("categories")}
            className={
              tab === "categories" ? "bg-[#2D6A4F] hover:bg-[#1B4D3E]" : ""
            }
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            Categories
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">
              {products.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-gray-900">
              {categories.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-red-600">
              {products.filter((p) => p.stock < 10).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Inventory Value</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(
                products.reduce((sum, p) => sum + p.price * p.stock, 0),
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {tab === "products" ? (
        <>
          {/* Actions */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => openProductForm()}
              className="bg-[#2D6A4F] hover:bg-[#1B4D3E]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Product
            </Button>
          </div>

          {/* Product Table */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">
                      Cost
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">
                      Barcode
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const category = categories.find(
                        (c) => c.id === product.categoryId,
                      );
                      return (
                        <tr
                          key={product.id}
                          className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {product.name}
                                </p>
                                {product.description && (
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-[#E8F5E9] text-[#2D6A4F] text-xs rounded-full font-medium">
                              {category?.name || "Uncategorized"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {formatCurrency(product.costPrice)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-medium ${product.stock < 10 ? "text-red-600" : "text-gray-900"}`}
                            >
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                            {product.barcode || "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openProductForm(product)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "product",
                                    id: product.id,
                                  })
                                }
                                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-gray-400"
                      >
                        <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p>No products yet.</p>
                        <p className="text-xs mt-1">
                          Click "Add Product" to get started.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Button
              onClick={() => openCategoryForm()}
              className="bg-[#2D6A4F] hover:bg-[#1B4D3E]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const productCount = products.filter(
                (p) => p.categoryId === category.id,
              ).length;
              return (
                <Card
                  key={category.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {productCount} products
                        </p>
                        {category.description && (
                          <p className="text-xs text-gray-400 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openCategoryForm(category)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "category",
                              id: category.id,
                            })
                          }
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No categories yet.</p>
                <p className="text-xs mt-1">
                  Create your first category to organize products.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <Input
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="e.g., A4 Notebook"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <Input
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Selling Price *
                </label>
                <Input
                  type="number"
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Cost Price
                </label>
                <Input
                  type="number"
                  value={pCost}
                  onChange={(e) => setPCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Stock Quantity *
                </label>
                <Input
                  type="number"
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Barcode
                </label>
                <Input
                  value={pBarcode}
                  onChange={(e) => setPBarcode(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Image URL
              </label>
              <Input
                value={pImage}
                onChange={(e) => setPImage(e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
              {pImage && (
                <img
                  src={pImage}
                  alt="Preview"
                  className="mt-2 w-16 h-16 rounded-lg object-cover border border-gray-200"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowProductForm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4D3E]"
                onClick={saveProduct}
              >
                {editProduct ? "Update" : "Add"} Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Category Name *
              </label>
              <Input
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="e.g., Notebooks"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <Input
                value={cDesc}
                onChange={(e) => setCDesc(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCategoryForm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4D3E]"
                onClick={saveCategory}
              >
                {editCategory ? "Update" : "Add"} Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteTarget?.type}? This
              action cannot be undone.
              {deleteTarget?.type === "category" &&
                " All products in this category will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
