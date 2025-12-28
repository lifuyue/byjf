from __future__ import annotations

from django.urls import path

from . import views

app_name = "rulesapp"

urlpatterns = [
    path("score-limits/", views.ScoreLimitView.as_view(), name="score_limits"),
    path("score-category-rules/", views.ScoreCategoryRuleView.as_view(), name="score_category_rules"),
    path("policies/", views.PolicyUploadView.as_view(), name="policies"),
    path("proof-review/", views.ProofReviewView.as_view(), name="proof_review"),
]
