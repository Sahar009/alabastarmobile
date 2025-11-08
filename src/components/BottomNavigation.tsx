import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Home, Calendar, MessageSquare, User, Wallet } from 'lucide-react-native';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isProvider?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, isProvider }) => {
  const tabs = isProvider
    ? [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'bookings', label: 'Bookings', icon: Calendar },
        { id: 'earnings', label: 'Earnings', icon: Wallet },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'profile', label: 'Profile', icon: User },
      ]
    : [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'bookings', label: 'Bookings', icon: Calendar },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'profile', label: 'Profile', icon: User },
      ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => onTabChange(tab.id)}
          activeOpacity={0.7}
        >
          <tab.icon 
            size={20} 
            color={activeTab === tab.id ? '#ec4899' : '#64748b'} 
          />
          <Text style={[
            styles.tabLabel,
            activeTab === tab.id && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fdf2f8',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabLabel: {
    color: '#ec4899',
    fontWeight: '600',
  },
});

export default BottomNavigation;
