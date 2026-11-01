export function publicUser(user) {
  if (!user) return null
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    active: Boolean(user.active),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }
}

export function serializeCategory(category, productCount) {
  if (!category) return null
  return {
    id: category.catalogId,
    _id: String(category._id),
    name: category.name,
    tagline: category.tagline,
    description: category.description,
    image: category.image,
    active: Boolean(category.active),
    ...(productCount !== undefined ? { productCount } : {}),
  }
}

export function serializeProduct(product) {
  if (!product) return null
  const category =
    product.category && typeof product.category === 'object'
      ? product.category.name
      : undefined

  return {
    id: product.catalogId,
    _id: String(product._id),
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category,
    categoryId:
      product.category && typeof product.category === 'object'
        ? product.category.catalogId
        : undefined,
    price: product.price,
    compareAt: product.compareAt ?? null,
    rating: product.rating,
    reviews: product.reviews,
    image: product.image,
    badge: product.badge ?? null,
    description: product.description,
    featured: Boolean(product.featured),
    bestSeller: Boolean(product.bestSeller),
    stock: product.stock,
    specs: product.specs ?? [],
    features: product.features ?? [],
    active: Boolean(product.active),
  }
}

export function serializeCart(cart) {
  if (!cart) return { items: [] }
  return {
    id: String(cart._id),
    items: (cart.items ?? []).map((item) => ({
      product: serializeProduct(item.product),
      productId: item.product?.catalogId,
      quantity: item.quantity,
    })),
  }
}

export function serializeAddress(address) {
  if (!address) return null
  return {
    id: String(address._id),
    label: address.label,
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: Boolean(address.isDefault),
  }
}

export function serializeOrder(order) {
  if (!order) return null
  return {
    id: order.publicId,
    _id: String(order._id),
    userId: order.user ? String(order.user) : null,
    status: order.status,
    contact: order.contact,
    shippingAddress: order.shippingAddress,
    delivery: order.delivery,
    payment: order.payment,
    items: (order.items ?? []).map((item) => ({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    promo: order.promo,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
  }
}

export function serializeReview(review) {
  if (!review) return null
  return {
    id: String(review._id),
    productId:
      review.product && typeof review.product === 'object'
        ? review.product.catalogId
        : undefined,
    rating: review.rating,
    title: review.title,
    body: review.body,
    verifiedPurchase: Boolean(review.verifiedPurchase),
    status: review.status,
    user:
      review.user && typeof review.user === 'object'
        ? {
            id: String(review.user._id),
            name: review.user.name,
          }
        : undefined,
    createdAt: review.createdAt,
  }
}
