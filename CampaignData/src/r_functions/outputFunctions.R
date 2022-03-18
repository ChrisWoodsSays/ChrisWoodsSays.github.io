# Response Category Visual Encoding
GetResponseCategoryIcon = function(responseCategory) {
  responseCategoryIcon = case_when(
  responseCategory == "Committed" ~ "smile",
  responseCategory == "Not Committed" ~ "frown",
  responseCategory == "No Response" ~ "ban",
  TRUE ~ "exclamation")
}

GetResponseCategoryColour = function(responseCategory) {
  responseCategoryColour = case_when(
  responseCategory == "Committed" ~ "forestgreen",
  responseCategory == "Not Committed" ~ "grey",
  responseCategory == "No Response" ~ "grey",
  TRUE ~ "grey")
}

# Build Interactive Ward/ Candidate/ Response Table
buildWardTable = function(wards, elementId) {
  rtbl <- reactable( # Top Ward Level
    pagination = FALSE,
    theme = fivethirtyeight(),
    wards,
    elementId = elementId,
    columns = list(
      ward = colDef(name = "Ward"
      ),
      wardCode = colDef(show = FALSE),
      responseRate = colDef(name = "Responded",
                                align = "left",
                                cell = data_bars(wards, 
                                                 text_position = "above",
                                                 #round_edges = TRUE, 
                                                 fill_color = "forestgreen", 
                                                 number_fmt = scales::percent)),
      committedRate = colDef(name = "Committed",
                            align = "left",
                            cell = data_bars(wards, 
                                             text_position = "above",
                                             #round_edges = TRUE, 
                                             fill_color = "forestgreen", 
                                             number_fmt = scales::percent)),
      totalCount = colDef(show = FALSE),
      committedCount = colDef(show = FALSE),
      notCommittedCount = colDef(show = FALSE),
      noResponseCount = colDef(show = FALSE),
      otherCount = colDef(show = FALSE)
    ),
    details = function(index) {
      wardCandidates <- candidates[candidates$wardCode == wards$wardCode[index],] %>%
        select(wardCode, candidateName, candidatePartyName, candidateURL,
               candidateParty, responseCount, committedCount
               ) %>%
        arrange(candidateName)
      htmltools::div(style = "padding: 16px",
                     reactable( # Level 2 Candidate Level
                       wardCandidates,
                       outlined = FALSE,
                       columns = list(
                         wardCode = colDef(show = FALSE),
                         candidatePartyName = colDef(name = "Party", width = 100),
                         candidateParty = colDef(show = FALSE),
                         candidateName = colDef(name = "Candidate",
                                                style = function(value, index) {
                                                  fill <- partyColour(wardCandidates$candidateParty[index])
                                                  list(color = ifelse(fill == "#FAA61A", "black", "white"), background = fill)
                                                }
                          ),
                         responseCount = colDef(name = "Responses",
                                                      width = 100,
                                                      align = "left",
                                                      cell = icon_assign(wardCandidates,
                                                                         icon = "check", icon_size = 20, fill_color = "sienna1")),
                         committedCount = colDef(name = "Committed Responses",
                                                     width = 100,
                                                     align = "left",
                                                     cell = icon_assign(wardCandidates,
                                                                        icon = "smile", icon_size = 20, fill_color = "forestgreen")),


                         candidateURL = colDef(name = "Web Site", 
                                               cell = function(value, index) {
                                                 url <- wardCandidates$candidateURL[index]
                                                 htmltools::tags$a(href = url, target = "_blank", as.character(value))
                         })
                       ),
                       details = function(index) {
                         responses <- candidateResponses[candidateResponses$wardCode == wardCandidates$wardCode[index] & 
                                                         candidateResponses$candidateName == wardCandidates$candidateName[index],] %>%
                           arrange(questionNo) %>%
                           left_join(questions, by = "questionNo") %>%
                           select(questionNo, question, response, responseCategory) %>%
                           mutate(
                             responseCategoryIcon = GetResponseCategoryIcon(responseCategory),
                             responseCategoryColour = GetResponseCategoryColour(responseCategory)
                           )
                         
                         htmltools::div(style = "padding: 16px",
                                        reactable( # Level 3 - Q&A
                                          responses,
                                          outlined = FALSE,
                                          columns = list(
                                            questionNo = colDef(name = "No.", width = 40),
                                            question = colDef(name = "Question"),
                                            response = colDef(name = "Response"),
                                            responseCategoryIcon = colDef(show = FALSE),
                                            responseCategoryColour = colDef(show = FALSE),
                                            responseCategory = colDef(name = "",
                                                                      width = 40,
                                                                      align = "right",
                                                                      cell = icon_sets(responses, 
                                                                                     icon_position = "over",
                                                                                     icon_ref = "responseCategoryIcon", 
                                                                                     #colors = "black",
                                                                                     icon_color_ref = "responseCategoryColour",
                                                                                     icon_size = 20)
                                                                      )

                                          )
                                        )
                         )
                       },
                     ),
      )
    }
  ) %>% 
    # google_font(font_family = "Source Sans Pro")
    google_font(font_family = "Roboto")
  
  return(rtbl)
}

# Build Interactive Party/ Candidate/ Response Table
buildCandidateTable = function(candidates, candidateResponses, elementId) {
  rtbl <- reactable( # Top Party Level
    pagination = FALSE,
    theme = fivethirtyeight(),
    candidates,
    elementId = elementId,
    columns = list(
      wardCode = colDef(show = FALSE),
      totalCount = colDef(show = FALSE),
      notCommittedCount = colDef(show = FALSE),
      otherCount = colDef(show = FALSE),
      noResponseCount = colDef(show = FALSE),
      
      candidatePartyName = colDef(name = "Party", width = 100),
      candidateParty = colDef(show = FALSE),
      candidateName = colDef(name = "Candidate",
                             style = function(value, index) {
                               fill <- partyColour(candidates$candidateParty[index])
                               list(color = ifelse(fill == "#FAA61A", "black", "white"), background = fill)
                             }
      ),
      responseCount = colDef(name = "Responses",
                             width = 100,
                             align = "left",
                             cell = icon_assign(candidates,
                                                icon = "check", icon_size = 20, fill_color = "sienna1")),
      committedCount = colDef(name = "Committed Responses",
                              width = 100,
                              align = "left",
                              cell = icon_assign(candidates,
                                                 icon = "smile", icon_size = 20, fill_color = "forestgreen")),
      candidateURL = colDef(name = "Web Site", 
                            cell = function(value, index) {
                              url <- candidates$candidateURL[index]
                              htmltools::tags$a(href = url, target = "_blank", as.character(value))
                            })
    ),
    details = function(index) {
      responses <- candidateResponses[candidateResponses$candidatePartyName == candidates$candidatePartyName[index] & 
                                        candidateResponses$candidateName == candidates$candidateName[index],] %>%
        arrange(questionNo) %>%
        left_join(questions, by = "questionNo") %>%
        select(questionNo, question, response, responseCategory) %>%
        mutate(
          responseCategoryIcon = GetResponseCategoryIcon(responseCategory),
          responseCategoryColour = GetResponseCategoryColour(responseCategory)
        )
      htmltools::div(style = "padding: 16px",
                     reactable( # Level 3 - Q&A
                       responses,
                       outlined = FALSE,
                       columns = list(
                         questionNo = colDef(name = "No.", width = 40),
                         question = colDef(name = "Question"),
                         response = colDef(name = "Response"),
                         responseCategoryIcon = colDef(show = FALSE),
                         responseCategoryColour = colDef(show = FALSE),
                         responseCategory = colDef(name = "",
                                                   width = 40,
                                                   align = "right",
                                                   cell = icon_sets(responses, 
                                                                    icon_position = "over",
                                                                    icon_ref = "responseCategoryIcon", 
                                                                    icon_color_ref = "responseCategoryColour",
                                                                    icon_size = 20)
                         )
                       )
                     )
      )
    }
  ) %>% 
    # google_font(font_family = "Source Sans Pro")
    google_font(font_family = "Roboto")
  
  return(rtbl)
}
