'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, Button, Input } from '@/components';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit2, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import Image from 'next/image';

interface ProfileData {
  user: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
    phone: string;
  };
  bio: string;
  date_of_birth: string;
  address: string;
  avatar: string | null;
}

import { authAPI } from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    date_of_birth: '',
    address: ''
  });

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfile(response.data);
      setFormData({
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        phone: response.data.user.phone,
        bio: response.data.bio || '',
        date_of_birth: response.data.date_of_birth || '',
        address: response.data.address || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdate = async () => {
    try {
      await authAPI.updateProfile({
        user: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
        },
        bio: formData.bio,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
      fetchProfile(); // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!profile) return <div className="p-8 text-center">Profile not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <Button
          variant={isEditing ? 'primary' : 'outline'}
          onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
        >
          {isEditing ? (
            <><FiSave className="mr-2" /> Save Changes</>
          ) : (
            <><FiEdit2 className="mr-2" /> Edit Profile</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="md:col-span-1">
          <Card className="p-6 text-center h-full">
            <div className="w-32 h-32 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
              {profile.avatar ? (
                <Image src={profile.avatar} alt="Profile" fill className="object-cover" />
              ) : (
                <span className="text-4xl text-primary-600 font-bold">
                  {profile.user.first_name?.[0]}{profile.user.last_name?.[0]}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {profile.user.first_name} {profile.user.last_name}
            </h2>
            <p className="text-gray-500 capitalize mb-4">{profile.user.user_type}</p>
            <div className="text-left space-y-3 mt-6">
              <div className="flex items-center text-gray-600">
                <FiMail className="mr-3" />
                <span className="text-sm">{profile.user.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FiPhone className="mr-3" />
                <span className="text-sm">{profile.user.phone || 'No phone added'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Details Card */}
        <div className="md:col-span-2">
          <Card className="p-6 h-full">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                {isEditing ? (
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                  />
                ) : (
                  <p className="text-gray-600">{profile.bio || 'No bio provided'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center text-gray-600">
                      <FiCalendar className="mr-2" />
                      {profile.date_of_birth || 'Not set'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center text-gray-600">
                      <FiMapPin className="mr-2" />
                      {profile.address || 'Not set'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
