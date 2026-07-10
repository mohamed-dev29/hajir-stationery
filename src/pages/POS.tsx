import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Printer,
  ShoppingCart,
  X,
  CreditCard,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProducts, useSales } from "@/hooks/useDatabase";
import { useCategories } from "@/hooks/useDatabase";
import type { CartItem, Product } from "@/types";
import { toast } from "sonner";

export default function POSPage() {
  const { products } = useProducts();
  const { categories } = useCategories();
  const { addSale } = useSales();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [cashPaid, setCashPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      const matchesCategory =
        activeCategory === "all" || p.categoryId === activeCategory;
      return matchesSearch && matchesCategory && p.stock > 0;
    });
  }, [products, search, activeCategory]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Not enough stock available");
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = Math.max(
            1,
            Math.min(item.quantity + delta, item.product.stock),
          );
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const total = subtotal - discount;
  const change = Math.max(0, parseFloat(cashPaid || "0") - total);

  const handlePayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (paymentMethod === "cash" && parseFloat(cashPaid || "0") < total) {
      toast.error("Insufficient cash paid");
      return;
    }

    const sale = addSale({
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity,
      })),
      subtotal,
      discount,
      total,
      cashPaid: paymentMethod === "cash" ? parseFloat(cashPaid) : total,
      change: paymentMethod === "cash" ? change : 0,
      customerName,
      customerPhone,
      paymentMethod,
    });

    setLastSale(sale);
    setShowReceipt(true);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount(0);
    setCashPaid("");
    toast.success("Sale completed successfully!");
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 2,
    }).format(v);

  return (
    <div className="flex h-full animate-slideInRight">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products or scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className={
                activeCategory === "all"
                  ? "bg-[#2D6A4F] hover:bg-[#1B4D3E]"
                  : ""
              }
            >
              All Products
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className={
                  activeCategory === cat.id
                    ? "bg-[#2D6A4F] hover:bg-[#1B4D3E]"
                    : ""
                }
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-[#2D6A4F]/30 transition-all active:scale-95 group"
                >
                  <div className="aspect-square rounded-lg bg-gray-50 mb-3 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCart className="w-8 h-8 text-gray-300 group-hover:text-[#2D6A4F] transition-colors" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Stock: {product.stock}
                  </p>
                  <p className="text-base font-bold text-[#2D6A4F] mt-1">
                    {formatCurrency(product.price)}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Package className="w-12 h-12 mb-3" />
              <p className="text-sm">No products found.</p>
              <p className="text-xs mt-1">
                Add products in the Products section.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Cart ({cart.length})
          </h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>Your cart is empty</p>
              <p className="text-xs mt-1">Click products to add them</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-slideUp"
              >
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.product.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Payment Section */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              placeholder="Phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Payment Method */}
          <div className="flex gap-2">
            {(["cash", "card", "transfer"] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  paymentMethod === method
                    ? "bg-[#2D6A4F] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Discount */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Discount:</span>
            <Input
              type="number"
              placeholder="0.00"
              value={discount || ""}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm flex-1"
            />
          </div>

          {/* Cash Input */}
          {paymentMethod === "cash" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Cash:</span>
              <Input
                type="number"
                placeholder="0.00"
                value={cashPaid}
                onChange={(e) => setCashPaid(e.target.value)}
                className="h-8 text-sm flex-1"
              />
            </div>
          )}

          {/* Totals */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-red-500">
                  -{formatCurrency(discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2">
              <span>Total</span>
              <span className="text-[#2D6A4F]">{formatCurrency(total)}</span>
            </div>
            {paymentMethod === "cash" && parseFloat(cashPaid || "0") > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Change</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(change)}
                </span>
              </div>
            )}
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            disabled={cart.length === 0}
            className="w-full h-12 bg-[#2D6A4F] hover:bg-[#1B4D3E] text-white font-semibold text-base"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay & Print Receipt
          </Button>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Receipt</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="text-center space-y-4">
              <div>
                <h3 className="font-bold text-lg">HAAJIR STATIONERY</h3>
                <p className="text-xs text-gray-500">Tel: +251 92 923 2959</p>
                <p className="text-xs text-gray-500 mt-1">
                  {lastSale.receiptNumber}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(lastSale.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-b border-gray-200 py-3 text-left space-y-2">
                {lastSale.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastSale.subtotal)}</span>
                </div>
                {lastSale.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount</span>
                    <span>-{formatCurrency(lastSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2">
                  <span>TOTAL</span>
                  <span>{formatCurrency(lastSale.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <span>Paid via {lastSale.paymentMethod}</span>
                  {lastSale.change > 0 && (
                    <span>Change: {formatCurrency(lastSale.change)}</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400 pt-2">
                Thank you for your business!
              </p>

              <Button
                onClick={() => window.print()}
                variant="outline"
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
