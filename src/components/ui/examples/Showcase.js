import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Modal,
  Badge,
  Avatar,
  AvatarGroup,
  Loading,
  Skeleton,
  Spinner,
  Tooltip,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '../index';
import {
  Plus,
  Edit,
  Trash,
  Copy,
  Star,
  Settings,
  User,
  Search,
  Menu,
  X,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';

const Showcase = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-12"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Muse UI Component Library</h1>
          <p className="text-xl text-gray-600">Beautiful, accessible components for the Muse platform</p>
        </div>

        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button Sizes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button States</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button icon={Plus}>With Icon</Button>
                <Button icon={Settings} iconPosition="right">Icon Right</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This is a standard card with default styling.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">Learn More</Button>
              </CardFooter>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle>Hover Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This card has hover effects with scaling and shadow changes.</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" size="sm">Interact</Button>
              </CardFooter>
            </Card>

            <Card glass hover>
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This card uses glass morphism with backdrop blur.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">Explore</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Forms Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Form Elements</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  icon={User}
                  required
                />
                <Input
                  label="Search"
                  type="text"
                  placeholder="Search..."
                  icon={Search}
                  iconPosition="left"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  error="Password is required"
                />
                <Input
                  label="Disabled Field"
                  type="text"
                  placeholder="This is disabled"
                  disabled
                  helper="This field is currently disabled"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Textareas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  label="Message"
                  placeholder="Type your message here..."
                  rows={4}
                  helper="Maximum 500 characters"
                />
                <Textarea
                  label="Error State"
                  placeholder="This has an error"
                  error="Please enter a valid message"
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges and Avatars */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Badges & Avatars</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge icon={Star}>Featured</Badge>
                  <Badge icon={Check}>Verified</Badge>
                  <Badge icon={AlertCircle}>Alert</Badge>
                  <Badge icon={Info}>Info</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avatars</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar size="xs" fallback="JD" />
                  <Avatar size="sm" fallback="JD" />
                  <Avatar size="md" fallback="JD" />
                  <Avatar size="lg" fallback="JD" />
                  <Avatar size="xl" fallback="JD" border />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Avatar Group:</p>
                  <AvatarGroup max={3} size="md">
                    <Avatar src="https://picsum.photos/100/100" fallback="User 1" />
                    <Avatar src="https://picsum.photos/101/101" fallback="User 2" />
                    <Avatar src="https://picsum.photos/102/102" fallback="User 3" />
                    <Avatar src="https://picsum.photos/103/103" fallback="User 4" />
                    <Avatar src="https://picsum.photos/104/104" fallback="User 5" />
                  </AvatarGroup>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Loading States */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Loading States</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Loading Component</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Loading size="sm" text="Loading..." />
                <Loading size="md" text="Please wait..." />
                <Loading size="lg" text="Almost done..." />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spinners</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-around">
                  <Spinner size="sm" color="purple" />
                  <Spinner size="md" color="blue" />
                  <Spinner size="lg" color="green" />
                  <Spinner size="xl" color="red" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skeletons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton width="100%" height="16px" />
                <Skeleton width="75%" height="16px" />
                <Skeleton width="50%" height="16px" />
                <div className="flex space-x-3">
                  <Skeleton width="40px" height="40px" variant="circle" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height="12px" />
                    <Skeleton width="40%" height="12px" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Interactive Components */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive Components</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tooltip</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <Tooltip content="Copy to clipboard" position="top">
                    <Button variant="outline" icon={Copy} size="sm" />
                  </Tooltip>
                  <Tooltip content="Edit this item" position="bottom">
                    <Button variant="outline" icon={Edit} size="sm" />
                  </Tooltip>
                  <Tooltip content="Delete item" position="left">
                    <Button variant="outline" icon={Trash} size="sm" />
                  </Tooltip>
                  <Tooltip content="View settings" position="right">
                    <Button variant="outline" icon={Settings} size="sm" />
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dropdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Dropdown
                  trigger={<Button>Actions Menu</Button>}
                  position="bottom-right"
                >
                  <DropdownHeader>Actions</DropdownHeader>
                  <DropdownItem icon={Edit}>Edit</DropdownItem>
                  <DropdownItem icon={Copy}>Copy</DropdownItem>
                  <DropdownItem icon={Star}>Star</DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem icon={Trash} danger>Delete</DropdownItem>
                </Dropdown>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tabs</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={0}>
                  <TabsList>
                    <TabsTrigger>Overview</TabsTrigger>
                    <TabsTrigger>Details</TabsTrigger>
                    <TabsTrigger>Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent>
                    <div className="space-y-4">
                      <p>This is the overview tab content.</p>
                      <Button variant="primary">Get Started</Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent>
                    <div className="space-y-4">
                      <p>Detailed information goes here.</p>
                      <Input label="Detail Name" placeholder="Enter detail..." />
                    </div>
                  </TabsContent>
                  
                  <TabsContent>
                    <div className="space-y-4">
                      <p>Configure your settings here.</p>
                      <div className="space-y-3">
                        <Input label="Username" placeholder="Enter username..." />
                        <Input label="Email" type="email" placeholder="Enter email..." />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Modal Demo */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Modal</h2>
          <Card>
            <CardContent className="pt-6">
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
              
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Example Modal"
                size="md"
              >
                <div className="space-y-4">
                  <p>This is an example modal with the Muse UI component library.</p>
                  <Input
                    label="Sample Input"
                    placeholder="Type something..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsModalOpen(false)}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Modal>
            </CardContent>
          </Card>
        </section>
      </motion.div>
    </div>
  );
};

export default Showcase;
