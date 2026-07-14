# Custom Filters Implementation Guide

## Overview
The DynamicTableView component now supports custom filters that can be defined per table. Each form component can pass its own filter configuration.

## How to Use

### 1. Define Filters in Your Form Component

In `CreateCategoryForm.tsx` (or any form component), pass a `filters` array to DynamicTableView:

```tsx
<DynamicTableView<Category>
  apiEndpoint="/api/categories"
  title="Category"
  filters={[
    { key: "name", label: "Category Name", type: "text" },
    { key: "type", label: "Type", type: "select", options: types },
    { key: "createdAt", label: "Created Date", type: "date" }
  ]}
  columns={[...]}
  onDuplicate={handleDuplicate}
/>
```

### 2. Filter Types

- **text**: Text input for searching
- **date**: Date picker for date filtering
- **select**: Dropdown with options array

### 3. Filter Configuration

```typescript
interface FilterConfig {
  key: string;                    // API parameter name
  label: string;                  // Display label
  type: "text" | "date" | "select";
  options?: Array<{               // For select type only
    _id: string;
    name: string;
  }>;
}
```

### 4. API Endpoint Requirements

Your API endpoint must accept filter parameters:
- Text filters: `?name=value`
- Date filters: `?startDate=2024-01-01&endDate=2024-12-31`
- Select filters: `?type=typeId`

Example: `/api/categories?page=1&limit=10&name=searchterm&type=typeId`

### 5. How Filters Work

1. User enters filter values in the form
2. Filters are NOT applied while typing
3. User clicks "Apply Filters" button
4. Page resets to 1
5. API is called with filter parameters
6. Results are filtered BEFORE pagination
7. Total pages recalculate based on filtered results

### 6. Example: Categories Table

```tsx
<DynamicTableView<Category>
  apiEndpoint="/api/categories"
  title="Category"
  filters={[
    { 
      key: "name", 
      label: "Search by Name", 
      type: "text" 
    },
    { 
      key: "type", 
      label: "Filter by Type", 
      type: "select",
      options: types 
    }
  ]}
  columns={[
    { key: "name", label: "Name" },
    { key: "purpose", label: "Best for" },
    { key: "type", label: "Type", render: (v) => v?.name || "-" }
  ]}
/>
```

### 7. Backend Implementation

Ensure your API route handles the filter parameters:

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const type = searchParams.get("type");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const query: any = {};
  if (name) query.name = { $regex: name, $options: "i" };
  if (type) query.type = type;

  const skip = (page - 1) * limit;
  const data = await Model.find(query).skip(skip).limit(limit);
  const total = await Model.countDocuments(query);

  return successResponse({
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}
```

## Features

✅ Dynamic filter configuration per table
✅ Multiple filter types (text, date, select)
✅ Filters applied BEFORE pagination
✅ Individual filter deletion
✅ Clear all filters button
✅ Filter badges showing active filters
✅ Enter key support for text filters
✅ No filters applied while typing
✅ Empty state when no results match filters
