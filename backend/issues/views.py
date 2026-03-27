from rest_framework import viewsets
from .models import Issue
from .serializers import IssueSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    @api_view(['POST'])
def create_issue(request):
    title = request.data.get('title')
    if not title:
        return Response({'error': "Title is required"}, status=400)
    
    description = request.data.get('description')
    if not description:
        return Response({'error': "Description is required"}, status=400)
    
    issue = Issue.objects.create(
        title=title,
        description=description
    )
    return Response({'message': "Issue created"})

@api_view(['POST'])
def submit_placement(request):
    student = request.data.get('student')
    company = request.data.get('company')
    if not student or not company:
        return Response({'error': "Student and company are required"}, status=400)
    placement = placement.objects.create(
        student=student,
        company=company
    )
    
    return Response({'message': "placement submitted"})

@api_view(['POST'])
def approve_placement(request, id):
    placement  = get_object_or_404(placement, id=id)
    placement.status = 'approved'
    placement.save()
    
    return Response({'message': "placement approved"})

@api_view(['POST'])
def submit_log(request):
    student = request.data.get('student')
    company = request.data.get('company')
    content = request.data.get('content')
    if not content:
        return Response({'error': "log content is required"}, status=400)
    
    return Response({'message': "log submitted"})

@api_view(['POST'])
def review_log(request, id):
    log = get_object_or_404(log , id=id)
    
    decision = request.data.get('decision')
    
    if decision not in ["approved", "rejected"]:
        return Response({'error': "Invalid decision"}, status=400)
    
    issue = Issue.objects.get(id=id)
    issue.status = decision
    issue.save()
    
    return Response({'message': "log reviewed"})

@api_view(['POST'])
def compute_score(request):
    weekly = request.data.get('weekly')
    supervisor = request.data.get('supervisor')
    report = request.data.get('report')

    if None in [weekly, supervisor, report]:
        return Response({"error": "All scores required"}, status=400)

    final_score = (weekly * 0.2) + (supervisor * 0.4) + (report * 0.4)

    return Response({"final_score": final_score})
