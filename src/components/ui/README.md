# Muse UI Component Library

A comprehensive, reusable UI component library built with React, Tailwind CSS, and Framer Motion. Designed to maintain the consistent "Muse" aesthetic across all platform modules with purple/blue gradients, glass morphism effects, and smooth animations.

## Features

- 🎨 **Muse Design System**: Purple/blue gradient color scheme with glass morphism
- 🚀 **Performance Optimized**: Built with React and Tailwind CSS
- ✨ **Smooth Animations**: Powered by Framer Motion
- ♿ **Accessible**: ARIA support and keyboard navigation
- 📱 **Responsive**: Mobile-first design approach
- 🔧 **Customizable**: Extensive props and variants

## Installation

```bash
# Components are already included in the project
# Import from the shared UI library:
import { Button, Card, Modal } from '../components/ui';
```

## Components

### Button

A versatile button component with multiple variants and sizes.

```jsx
import { Button } from '../components/ui';

// Primary button
<Button onClick={handleClick}>Click me</Button>

// With icon
<Button icon={Plus} iconPosition="left">Add Item</Button>

// Different variants
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="danger">Delete</Button>

// Loading state
<Button loading={true}>Processing...</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `loading`: boolean
- `disabled`: boolean
- `icon`: Lucide React icon component
- `iconPosition`: 'left' | 'right'

### Card

Flexible card component with glass morphism effects.

```jsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui';

<Card hover glass>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Props:**
- `hover`: boolean (enables hover effects)
- `glass`: boolean (glass morphism effect)
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `shadow`: 'none' | 'sm' | 'md' | 'lg' | 'xl'

### Input

Form input with validation states and helper text.

```jsx
import { Input, Textarea } from '../components/ui';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  helper="We'll never share your email"
  required
/>

<Textarea
  label="Message"
  placeholder="Type your message..."
  rows={4}
/>
```

**Props:**
- `label`: string
- `error`: string (validation error)
- `helper`: string (helper text)
- `required`: boolean
- `disabled`: boolean
- `icon`: Lucide React icon component
- `iconPosition`: 'left' | 'right'

### Modal

Accessible modal with backdrop and escape key support.

```jsx
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <ModalBody>
    <p>Are you sure you want to proceed?</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `showCloseButton`: boolean
- `closeOnBackdropClick`: boolean

### Badge

Small status indicators with multiple variants.

```jsx
import { Badge } from '../components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Error</Badge>
<Badge icon={Star}>Featured</Badge>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: Lucide React icon component

### Avatar

User avatar with fallback initials and group support.

```jsx
import { Avatar, AvatarGroup } from '../components/ui';

<Avatar
  src="/path/to/image.jpg"
  alt="John Doe"
  size="lg"
  fallback="John Doe"
  border
/>

<AvatarGroup max={3} size="md">
  <Avatar src="/user1.jpg" fallback="User 1" />
  <Avatar src="/user2.jpg" fallback="User 2" />
  <Avatar src="/user3.jpg" fallback="User 3" />
  <Avatar src="/user4.jpg" fallback="User 4" />
</AvatarGroup>
```

**Props:**
- `src`: string (image URL)
- `alt`: string
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
- `fallback`: string (for initials)
- `border`: boolean

### Loading

Loading states with spinners and skeletons.

```jsx
import { Loading, Skeleton, Spinner } from '../components/ui';

<Loading text="Loading data..." overlay />

<Skeleton width="100%" height="20px" variant="rect" />
<Skeleton width="50px" height="50px" variant="circle" />

<Spinner size="md" color="purple" />
```

**Props (Loading):**
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `text`: string
- `overlay`: boolean

**Props (Skeleton):**
- `variant`: 'rect' | 'circle' | 'text'
- `width`: string
- `height`: string

**Props (Spinner):**
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'purple' | 'blue' | 'green' | 'red' | 'gray'

### Tooltip

Hover tooltips with positioning options.

```jsx
import { Tooltip } from '../components/ui';

<Tooltip content="Click to copy" position="top">
  <Button>Copy</Button>
</Tooltip>
```

**Props:**
- `content`: string
- `position`: 'top' | 'bottom' | 'left' | 'right'
- `delay`: number (in milliseconds)

### Dropdown

Dropdown menus with keyboard navigation.

```jsx
import { Dropdown, DropdownItem, DropdownSeparator, DropdownHeader } from '../components/ui';

<Dropdown
  trigger={<Button>Menu</Button>}
  position="bottom-right"
>
  <DropdownHeader>Actions</DropdownHeader>
  <DropdownItem icon={Edit}>Edit</DropdownItem>
  <DropdownItem icon={Copy}>Copy</DropdownItem>
  <DropdownSeparator />
  <DropdownItem icon={Trash} danger>Delete</DropdownItem>
</Dropdown>
```

**Props (Dropdown):**
- `trigger`: React node
- `position`: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'left' | 'right'
- `disabled`: boolean

**Props (DropdownItem):**
- `icon`: Lucide React icon component
- `danger`: boolean
- `disabled`: boolean

### Tabs

Tabbed interface with smooth transitions.

```jsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';

<Tabs defaultValue={0}>
  <TabsList>
    <TabsTrigger>Tab 1</TabsTrigger>
    <TabsTrigger>Tab 2</TabsTrigger>
    <TabsTrigger>Tab 3</TabsTrigger>
  </TabsList>
  
  <TabsContent>
    <p>Content for tab 1</p>
  </TabsContent>
  <TabsContent>
    <p>Content for tab 2</p>
  </TabsContent>
  <TabsContent>
    <p>Content for tab 3</p>
  </TabsContent>
</Tabs>
```

**Props (Tabs):**
- `defaultValue`: number (initial active tab)
- `orientation`: 'horizontal' | 'vertical'

## Design Tokens

### Colors
- **Primary**: Purple gradient (`#8b5cf6` to `#3b82f6`)
- **Secondary**: Gray palette
- **Success**: Green (`#10b981`)
- **Warning**: Yellow (`#f59e0b`)
- **Danger**: Red (`#ef4444`)

### Typography
- **Font**: Inter (system-ui fallback)
- **Weights**: 400 (normal), 500 (medium), 700 (bold)
- **Sizes**: xs (12px), sm (14px), base (16px), lg (18px), xl (20px)

### Spacing
- Follows Tailwind's spacing scale (4px base unit)
- Consistent padding: sm (12px), md (16px), lg (24px), xl (32px)

### Border Radius
- **Small**: `rounded-lg` (8px)
- **Medium**: `rounded-xl` (12px)
- **Large**: `rounded-2xl` (16px)
- **Full**: `rounded-full` (50%)

### Shadows
- **Subtle**: `shadow-sm`
- **Default**: `shadow-lg`
- **Strong**: `shadow-xl`
- **Dramatic**: `shadow-2xl`

## Best Practices

1. **Consistency**: Use the predefined variants and sizes
2. **Accessibility**: Always provide labels and ARIA attributes
3. **Performance**: Avoid excessive animations on large lists
4. **Mobile-first**: Test on smaller screens first
5. **Error handling**: Use error states for form validation

## Migration Guide

When refactoring existing components:

1. Import from the shared UI library
2. Replace inline styles with component props
3. Use semantic variants (primary, secondary, etc.)
4. Maintain existing functionality
5. Test responsive behavior

```jsx
// Before
<button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
  Click me
</button>

// After
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```
