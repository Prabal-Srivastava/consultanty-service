from django.urls import path
from . import views

urlpatterns = [
    # Room URLs
    path('rooms/', views.RoomListCreateView.as_view(), name='room-list-create'),
    path('rooms/<int:pk>/', views.RoomDetailView.as_view(), name='room-detail'),
    path('rooms/create/', views.create_room, name='create-room'),
    path('rooms/support/', views.create_support_chat, name='create-support-chat'),
    
    # Message URLs
    path('rooms/<int:room_id>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    # path('rooms/<int:room_id>/messages/create/', views.MessageCreateView.as_view(), name='message-create'), # Deprecated
    
    # Video Call URLs
    path('rooms/<int:room_id>/video-call/start/', views.start_video_call, name='start-video-call'),
    path('video-calls/<int:call_id>/accept/', views.accept_video_call, name='accept-video-call'),
    path('video-calls/<int:call_id>/end/', views.end_video_call, name='end-video-call'),
    path('video-calls/history/', views.VideoCallHistoryView.as_view(), name='video-call-history'),
    
    # Call Record URLs
    path('call-records/', views.CallRecordListView.as_view(), name='call-record-list'),
]