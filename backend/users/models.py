from django.db import models

class Issue(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
class customUser(AbstractUser):
    ROLE_CHOICES = (
        ("student","student"),
        ("workplace",workplace supervisor),
         ("Academic","Academic Supervisor"),
         ("admin"," Adminstrator")
    
    )
role = models.Charfield(
    max_length=30,
    choices=ROLE_CHOICES
)
department = models.charField(
    max_length=200,
    blank=True,
    null=True
)
staff_number = models.CharField(
    max_length=40,
    unique=True,
    blank=True,
    null=True
)
student_number =  models.CharFeild(
    max_lenth=40,
    unique=True,
    blank=True,
    null=True
)
organisation = models.CharField(
    max_lenth=200,
    blank=True,
    null=True
)
internship_start = models.DateField(
    blank=True,
    null=True
)
internship_end = models.DateFeild(
    blank=True,
    null=True
)
profile_picture = models.lmageFeild(upload_to"profiles/" , blank=true, null=True)
def __str__(self):
    return self.username
