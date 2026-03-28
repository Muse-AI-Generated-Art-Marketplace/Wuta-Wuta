import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Coins,
    Star,
    ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal } from './ui';
import { useWalletStore } from '../store/walletStore';
import { useTransactionNotificationStore } from '../store/transactionNotificationStore';
import toast from 'react-hot-toast';

const ClaimEarningsWidget = () => {
    const { address, network } = useWalletStore();
    const { addTransaction } = useTransactionNotificationStore();

    // Mock data for demonstration - in production, this would come from contract queries
    const [earnings, setEarnings] = useState({
        total: '2.45',
        ethereum: '1.23',
        stellar: '1.22',
        pending: '0.45',
        claimed: '2.00'
    });

    const [isClaiming, setIsClaiming] = useState(false);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [claimAmount, setClaimAmount] = useState('');
    const [claimNetwork, setClaimNetwork] = useState('all');

    // Mock transaction history for claims
    const [claimHistory, setClaimHistory] = useState([
        {
            id: 'claim-001',
            amount: '0.85',
            network: 'ethereum',
            status: 'completed',
            timestamp: '2024-01-15T10:30:00Z',
            txHash: '0x1234...5678'
        },
        {
            id: 'claim-002',
            amount: '1.15',
            network: 'stellar',
            status: 'completed',
            timestamp: '2024-01-10T14:20:00Z',
            txHash: 'ABC123...XYZ789'
        },
        {
            id: 'claim-003',
            amount: '0.45',
            network: 'ethereum',
            status: 'pending',
            timestamp: '2024-01-20T09:15:00Z',
            txHash: null
        }
    ]);

    const handleClaimEarnings = async () => {
        if (!address) {
            toast.error('Please connect your wallet first');
            return;
        }

        const currentTotal = parseFloat(earnings.total);
        if (currentTotal <= 0) {
            toast.error('No earnings available to claim');
            return;
        }

        const requested = claimAmount ? parseFloat(claimAmount) : currentTotal;
        if (isNaN(requested) || requested <= 0) {
            toast.error('Please enter a valid claim amount');
            return;
        }

        if (requested > currentTotal) {
            toast.error('Claim amount cannot exceed available balance');
            return;
        }

        setIsClaiming(true);

        try {
            // Mock claim process - in production, this would interact with smart contracts
            const transactionId = `claim-${Date.now()}`;

            // Add to transaction store
            addTransaction({
                id: transactionId,
                hash: null, // Will be set when transaction is submitted
                type: 'Claim Earnings',
                details: {
                    amount: requested.toFixed(2),
                    network: claimNetwork,
                    description: `Claiming ${requested.toFixed(2)} ETH/XLM in royalties`
                }
            });

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Update earnings (mock)
            setEarnings(prev => ({
                ...prev,
                total: (currentTotal - requested).toFixed(2),
                claimed: (parseFloat(prev.claimed) + requested).toFixed(2),
                pending: '0.00'
            }));

            // Add to claim history
            const newClaim = {
                id: transactionId,
                amount: requested.toFixed(2),
                network: claimNetwork,
                status: 'pending',
                timestamp: new Date().toISOString(),
                txHash: null
            };

            setClaimHistory(prev => [newClaim, ...prev]);

            toast.success('Claim transaction submitted successfully!');
            setShowClaimModal(false);
            setClaimAmount('');
            setClaimNetwork('all');

        } catch (error) {
            console.error('Claim error:', error);
            toast.error('Failed to claim earnings. Please try again.');
        } finally {
            setIsClaiming(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'failed':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <Badge variant="success">Completed</Badge>;
            case 'pending':
                return <Badge variant="warning">Pending</Badge>;
            case 'failed':
                return <Badge variant="error">Failed</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Earnings Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card hover>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                                <p className="text-2xl font-bold text-gray-900">{earnings.total} ETH</p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-sm text-green-500 font-medium">+12.5%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Ethereum</p>
                                <p className="text-2xl font-bold text-gray-900">{earnings.ethereum} ETH</p>
                                <div className="flex items-center mt-1">
                                    <Coins className="w-4 h-4 text-blue-500 mr-1" />
                                    <span className="text-sm text-blue-500 font-medium">ERC-721</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <Coins className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Stellar</p>
                                <p className="text-2xl font-bold text-gray-900">{earnings.stellar} XLM</p>
                                <div className="flex items-center mt-1">
                                    <Star className="w-4 h-4 text-purple-500 mr-1" />
                                    <span className="text-sm text-purple-500 font-medium">Soroban</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100">
                                <Star className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Claims</p>
                                <p className="text-2xl font-bold text-gray-900">{earnings.pending} ETH</p>
                                <div className="flex items-center mt-1">
                                    <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                                    <span className="text-sm text-yellow-500 font-medium">Processing</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-yellow-100">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Claim Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Claim Your Earnings</span>
                        <Button
                            onClick={() => setShowClaimModal(true)}
                            disabled={!address || parseFloat(earnings.total) === 0}
                            className="flex items-center gap-2"
                        >
                            <Wallet className="w-4 h-4" />
                            Claim Earnings
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">Available to Claim</h4>
                            <p className="text-2xl font-bold text-blue-600">{earnings.total} ETH/XLM</p>
                            <p className="text-sm text-blue-700 mt-1">
                                Combined royalties from all your artworks across networks
                            </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">Total Claimed</h4>
                            <p className="text-2xl font-bold text-green-600">{earnings.claimed} ETH/XLM</p>
                            <p className="text-sm text-green-700 mt-1">
                                Successfully withdrawn to your wallet
                            </p>
                        </div>
                    </div>

                    {!address && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                                <p className="text-yellow-800">
                                    Please connect your wallet to claim earnings
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Claim History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Claim History</span>
                        <Button variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {claimHistory.map((claim) => (
                            <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-3">
                                    {getStatusIcon(claim.status)}
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {claim.amount} {claim.network === 'ethereum' ? 'ETH' : 'XLM'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatTimestamp(claim.timestamp)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {getStatusBadge(claim.status)}
                                    {claim.txHash && (
                                        <Button variant="ghost" size="sm">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Claim Modal */}
            <Modal
                isOpen={showClaimModal}
                onClose={() => setShowClaimModal(false)}
                title="Claim Earnings"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Network
                        </label>
                        <select
                            value={claimNetwork}
                            onChange={(e) => setClaimNetwork(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Networks</option>
                            <option value="ethereum">Ethereum Only</option>
                            <option value="stellar">Stellar Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount to Claim (Optional)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={`Max: ${earnings.total}`}
                            value={claimAmount}
                            onChange={(e) => setClaimAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Leave empty to claim all available earnings
                        </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Claim Summary</h4>
                        <div className="space-y-1 text-sm text-blue-800">
                            <p>Network: {claimNetwork === 'all' ? 'All Networks' : claimNetwork.charAt(0).toUpperCase() + claimNetwork.slice(1)}</p>
                            <p>Amount: {claimAmount || earnings.total} {claimNetwork === 'ethereum' ? 'ETH' : claimNetwork === 'stellar' ? 'XLM' : 'ETH/XLM'}</p>
                            <p>Gas Fee: ~0.002 ETH (estimated)</p>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <Button
                            onClick={handleClaimEarnings}
                            disabled={isClaiming || parseFloat(earnings.total) === 0}
                            className="flex-1"
                        >
                            {isClaiming ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                    Confirm Claim
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowClaimModal(false)}
                            disabled={isClaiming}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ClaimEarningsWidget;