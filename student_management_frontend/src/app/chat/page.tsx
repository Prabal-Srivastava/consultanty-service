'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { chatAPI, authAPI } from '@/lib/api';
import { FiMessageSquare, FiSend, FiUsers, FiPlus, FiX, FiVideo, FiPhone, FiUser, FiSearch, FiBriefcase } from 'react-icons/fi';
import { Button, Card, Input } from '@/components';
import VideoCall from '@/components/Chat/VideoCall';

interface Room {
  id: number;
  name: string;
  room_type: string;
  participants: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  }>;
  is_active: boolean;
  created_at: string;
}

interface Message {
  id: number;
  room: number;
  sender: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface Tutor {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('one_on_one');
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ id: number; caller: string; audioOnly?: boolean } | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  
  // Tutor selection state
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [students, setStudents] = useState<Tutor[]>([]); // Reusing Tutor interface for students
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [audioOnly, setAudioOnly] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      fetchRooms();
      if (user.user_type === 'student') {
        fetchTutors();
      } else if (user.user_type === 'tutor') {
        fetchStudents();
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      connectWebSocket(selectedRoom.id);
    }

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTutors = async () => {
    try {
      setLoadingTutors(true);
      const response = await authAPI.getTutors();
      setTutors(response.data);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoadingTutors(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await authAPI.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleStartChatWithTutor = async (tutor: Tutor) => {
    try {
      // Create a room with this tutor
      const response = await chatAPI.createRoom({
        name: `Chat with ${tutor.first_name}`,
        room_type: 'one_on_one',
        participant_ids: [tutor.id]
      });
      
      setRooms(prev => [...prev, response.data]);
      setSelectedRoom(response.data);
      setShowTutorModal(false);
    } catch (error) {
      console.error('Error creating chat with tutor:', error);
      alert('Failed to start chat');
    }
  };

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await chatAPI.getRooms();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchMessages = async (roomId: number) => {
    try {
      setLoadingMessages(true);
      const response = await chatAPI.getMessages(roomId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const connectWebSocket = (roomId: number) => {
    if (websocket) {
      websocket.close();
    }

    const token = localStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat/${roomId}/?token=${token}`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    setWebsocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      if (data.type === 'chat_message') {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      } else if (data.type === 'call_notification') {
        setIncomingCall({
            id: data.call_id,
            caller: data.caller_name,
            audioOnly: data.audio_only
        });
      } else if (data.type === 'call_accepted') {
        // If we're the initiator, this is the signal to start our peer connection
        // (Handled by VideoCall component)
      } else if (data.type === 'call_ended') {
        setActiveCallId(null);
        setIncomingCall(null);
        setIsInitiator(false);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect logic could be added here
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const response = await chatAPI.createRoom({
        name: newRoomName,
        room_type: newRoomType,
        participants: newRoomType === 'group' ? selectedParticipants : []
      });
      
      setRooms(prev => [...prev, response.data]);
      setShowCreateRoom(false);
      setNewRoomName('');
      setSelectedParticipants([]);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleCreateSupportChat = async () => {
    try {
      const response = await chatAPI.createSupportChat();
      setRooms(prev => [...prev, response.data]);
      setSelectedRoom(response.data);
    } catch (error) {
      console.error('Error creating support chat:', error);
    }
  };

  const handleStartVideoCall = async () => {
    if (!selectedRoom) return;
    try {
        const response = await chatAPI.startVideoCall(selectedRoom.id, false);
        setActiveCallId(response.data.id);
        setIsInitiator(true);
        setAudioOnly(false);
    } catch (error) {
        console.error('Error starting video call:', error);
        alert('Failed to start video call');
    }
  };

  const handleStartVoiceCall = async () => {
    if (!selectedRoom) return;
    try {
        const response = await chatAPI.startVideoCall(selectedRoom.id, true);
        setActiveCallId(response.data.id);
        setIsInitiator(true);
        setAudioOnly(true);
    } catch (error) {
        console.error('Error starting voice call:', error);
        alert('Failed to start voice call');
    }
  };

  const handleAcceptCall = async () => {
    if (incomingCall) {
        try {
            await chatAPI.acceptVideoCall(incomingCall.id);
            setActiveCallId(incomingCall.id);
            setIsInitiator(false);
            setAudioOnly(incomingCall.audioOnly || false);
            setIncomingCall(null);
        } catch (error) {
            console.error('Error accepting call:', error);
            alert('Failed to accept call');
        }
    }
  };

  const handleEndCall = async () => {
    if (activeCallId) {
        try {
            await chatAPI.endVideoCall(activeCallId);
        } catch (error) {
            console.error('Error ending call:', error);
        }
    }
    setActiveCallId(null);
    setIsInitiator(false);
    setIncomingCall(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      // Send via REST API - Backend will broadcast to WebSocket
      await chatAPI.sendMessage(selectedRoom.id, {
        content: newMessage
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
          <div className="flex space-x-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateSupportChat}
            >
              <FiPhone className="mr-2" />
              Support Chat
            </Button>
            {user?.user_type === 'student' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTutorModal(true)}
              >
                <FiBriefcase className="mr-2" />
                Chat with Tutor
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateRoom(true)}
            >
              <FiPlus className="mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Rooms List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
                  <FiUsers className="text-gray-400" />
                </div>
                
                {loadingRooms ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedRoom?.id === room.id
                            ? 'bg-primary-100 border border-primary-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                            <FiMessageSquare className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {room.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {room.participants.length} participants
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {rooms.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FiMessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p className="font-medium mb-1">No chats yet</p>
                        <p className="text-sm mb-4">Start a conversation by creating a new chat or connecting with support</p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleCreateSupportChat}
                          >
                            <FiPhone className="mr-2" />
                            Connect with Support
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCreateRoom(true)}
                          >
                            <FiPlus className="mr-2" />
                            Create New Chat
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            {selectedRoom ? (
              <Card className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedRoom.name}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedRoom.participants.map(p => p.first_name).join(', ')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleStartVideoCall}
                      >
                        <FiVideo className="mr-1" />
                        Video Call
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleStartVoiceCall}
                      >
                        <FiPhone className="mr-1" />
                        Voice Call
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender.id === user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender.id === user.id
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center mb-1">
                              <FiUser className="mr-1 text-xs" />
                              <span className="text-xs font-medium">
                                {message.sender.first_name}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender.id === user.id ? 'text-primary-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-3">
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!newMessage.trim()}
                    >
                      <FiSend className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FiMessageSquare className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No chat selected</h3>
                  <p className="text-gray-500">Select a chat from the list to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Video Call Modal */}
      {activeCallId && selectedRoom && (
        <VideoCall
            callId={activeCallId}
            isInitiator={isInitiator}
            currentUser={user}
            onClose={handleEndCall}
            audioOnly={audioOnly}
        />
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm bg-white p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4 animate-pulse">
                        {incomingCall.audioOnly ? (
                            <FiPhone className="h-8 w-8 text-primary-600" />
                        ) : (
                            <FiVideo className="h-8 w-8 text-primary-600" />
                        )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Incoming {incomingCall.audioOnly ? 'Voice' : 'Video'} Call
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {incomingCall.caller} is calling you...
                    </p>
                    <div className="flex space-x-3 justify-center">
                        <Button
                            variant="primary"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleAcceptCall}
                        >
                            Accept
                        </Button>
                        <Button
                            variant="secondary"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => setIncomingCall(null)}
                        >
                            Decline
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Chat</h3>
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chat Name
                  </label>
                  <Input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter chat name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chat Type
                  </label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="one_on_one">One-on-One</option>
                    <option value="group">Group Chat</option>
                  </select>
                </div>

                {newRoomType === 'group' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Participants
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                      {(user?.user_type === 'tutor' ? students : tutors).map((participant) => (
                        <div key={participant.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`participant-${participant.id}`}
                            checked={selectedParticipants.includes(participant.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, participant.id]);
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(id => id !== participant.id));
                              }
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`participant-${participant.id}`} className="ml-2 block text-sm text-gray-900">
                            {participant.first_name} {participant.last_name} ({participant.username})
                          </label>
                        </div>
                      ))}
                      {(user?.user_type === 'tutor' ? students : tutors).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">No participants available</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim()}
                    className="flex-1"
                  >
                    Create Chat
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tutor Selection Modal */}
      {showTutorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Tutor to Chat</h3>
                <button
                  onClick={() => setShowTutorModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              {loadingTutors ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : tutors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No tutors available at the moment.</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto flex-1">
                  {tutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => handleStartChatWithTutor(tutor)}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                          <FiBriefcase />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tutor.first_name} {tutor.last_name}</p>
                          <p className="text-xs text-gray-500">{tutor.email}</p>
                        </div>
                      </div>
                      <FiMessageSquare className="text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowTutorModal(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}