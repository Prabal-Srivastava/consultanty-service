from django.contrib import admin
from .models import Room, Message, VideoCall, CallRecord

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'room_type', 'is_active', 'created_at')
    list_filter = ('room_type', 'is_active', 'created_at')
    search_fields = ('name',)
    filter_horizontal = ('participants',)
    ordering = ('-created_at',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'room', 'content', 'timestamp', 'is_read')
    list_filter = ('is_read', 'timestamp', 'room__room_type')
    search_fields = ('sender__username', 'content', 'room__name')
    ordering = ('-timestamp',)

@admin.register(VideoCall)
class VideoCallAdmin(admin.ModelAdmin):
    list_display = ('caller', 'receiver', 'room', 'status', 'start_time', 'end_time', 'duration')
    list_filter = ('status', 'created_at', 'room__room_type')
    search_fields = ('caller__username', 'receiver__username', 'room__name')
    ordering = ('-created_at',)

@admin.register(CallRecord)
class CallRecordAdmin(admin.ModelAdmin):
    list_display = ('video_call', 'recording_url', 'created_at')
    search_fields = ('video_call__caller__username', 'video_call__receiver__username')
    ordering = ('-created_at',)
