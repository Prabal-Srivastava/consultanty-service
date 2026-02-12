from django.db import models
from django.conf import settings

class Room(models.Model):
    ROOM_TYPES = (
        ('one_on_one', 'One-on-One'),
        ('group', 'Group Chat'),
        ('support', 'Support Chat'),
    )
    
    name = models.CharField(max_length=100)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='one_on_one')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='chat_rooms')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['-created_at']

class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}..."
    
    class Meta:
        ordering = ['timestamp']

class VideoCall(models.Model):
    CALL_STATUS = (
        ('pending', 'Pending'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('missed', 'Missed'),
        ('cancelled', 'Cancelled'),
    )
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='video_calls')
    caller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='outgoing_calls')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='incoming_calls', null=True, blank=True)
    status = models.CharField(max_length=20, choices=CALL_STATUS, default='pending')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(null=True, blank=True, help_text="Duration in seconds")
    audio_only = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        receiver_name = self.receiver.username if self.receiver else "Group"
        return f"Call from {self.caller.username} to {receiver_name}"
    
    class Meta:
        ordering = ['-created_at']

class CallRecord(models.Model):
    video_call = models.OneToOneField(VideoCall, on_delete=models.CASCADE, related_name='call_record')
    recording_url = models.URLField(blank=True)
    transcript = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Record for call {self.video_call.id}"