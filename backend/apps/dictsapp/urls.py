from django.urls import path

from . import views

app_name = "dictsapp"

urlpatterns = [
    path("categories/", views.DictCategoriesView.as_view(), name="categories"),
    path("<str:category>/", views.DictEntriesView.as_view(), name="entries"),
]
