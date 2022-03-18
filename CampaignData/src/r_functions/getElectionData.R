# Party Lookup Functions
partyColour = function(party) {
  colour <- parties$partyColour[parties$party == party]
  return(colour)
}
partyName = function(party) {
  name <- parties$partyName[parties$party == party]
  return(name)
}

downloadIfNeeded <- function(url, localFN) {
  if(file.exists(localFN)) {
    print(paste("No download required:", localFN))
    }
  else{
    download.file(url, localFN)
  }
}

googleSheetURL <- "https://docs.google.com/spreadsheets/d/1qXudYdw84YSL9j8ay0y3k_CH-SthkeO8lmjwc-qOJlU/edit#gid=80018853"

# Get Elected Party Meta Data
parties <- read.csv(here::here("data", "parties.csv"), stringsAsFactors = FALSE)

# Get Questions from Google Sheet
localDataSet <- "questions"
localPath <- here::here("downloads", paste0(localDataSet, ".RDS"))
if(file.exists(localPath)) {
  print(paste("No download from Google required:", localDataSet))
  questions <- read_rds(localPath)
} else {
  questions <- read_sheet(googleSheetURL,
                         sheet = "Asks & Questions") %>%
    clean_names() %>%
    filter(!is.na(x1)) %>% # Remove comment line
    rename(questionNo = x1) %>%
    select(questionNo, question)
  saveRDS(questions, localPath)
}

# getWardPopulations <- function() {
#   url <- 'https://www.birmingham.gov.uk/download/downloads/id/4608/2019_population_tool_birmingham_wards_mid-year_estimates.xlsx'
#   localDataSet <- "wardPopulations"
#   if(exists(localDataSet)) {
#     print(paste("No load required:", localDataSet))
#   } else {
#     localPath <- here::here("downloads", paste0(localDataSet, ".xlsx"))
#     downloadIfNeeded(url, localPath)
#     wardPopulations <- readxl::read_excel(localPath, sheet = "2019 five-year age", skip = 3) %>%
#       clean_names() %>%
#       rename(ward = x2019_ward, population2019 = all_people) %>%
#       select(ward , population2019)
#   }
#   return(wardPopulations)
# }

# Get Birmingham Wards (either locally if exists or download if not) Function
getBhamWards <- function() {
  # Ward to Local Authority District (December 2021) Lookup in the United Kingdom
  #https://geoportal.statistics.gov.uk/documents/ons::ward-to-local-authority-district-december-2021-lookup-in-the-united-kingdom/about
  url <- 'https://www.arcgis.com/sharing/rest/content/items/fe123ab719b2488ab41dd9c6aa84e79b/data'
  localDataSet <- "localAuthorities"
  if(exists(localDataSet)) {
    print(paste("No load required:", localDataSet))
  } else {
    localPath <- here::here("downloads", paste0(localDataSet, ".xlsx"))
    downloadIfNeeded(url, localPath)
    wards <- readxl::read_excel(localPath, sheet = 1, skip = 0) %>%
      rename(wardCode = WD21CD, ward = WD21NM, localAuthorityCode = LAD21CD, localAuthority = LAD21NM) %>%
      filter(localAuthority == "Birmingham") %>%
      select(-c(localAuthorityCode, localAuthority))
  }
  return(wards)
}

# Get Ward Boundaries Function
getBhamWardBoundaries <- function(bhamWards) {
  ## Ward Boundaries (December 2021) BSC (Super Generalised - not high res)
  # Downloaded from https://geoportal.statistics.gov.uk/datasets/ons::wards-december-2021-uk-bsc/about
  url <- 'https://opendata.arcgis.com/api/v3/datasets/bf9d32b1aa9941af84e6c2bf0c54b1bb_0/downloads/data?format=geojson&spatialRefId=4326'
  localDataSet <- "wardBoundaries"
  if(exists(localDataSet)) {
    print(paste("No load required:", localDataSet))
  } else {
    localPath <- here::here("downloads", paste0(localDataSet, ".geojson"))
    downloadIfNeeded(url, localPath)
    ukWardShapes <- sf::st_read(localPath)
    #filter just the ones where the ward code is in wards
    bhamWardShapes <- ukWardShapes %>%
      filter(WD21CD %in% bhamWards$wardCode)
  }
  return(bhamWardShapes)
}

# Load Candidate Response Data Function
getCandidatesResponses <- function() {
  localDataSet <- "candidatesAndResponses"
  localPath <- here::here("downloads", paste0(localDataSet, ".RDS"))
  if(file.exists(localPath)) {
    print(paste("No download from Google required:", localDataSet))
    candidatesAndResponses <- read_rds(localPath)
  } else {
    candidatesAndResponses <- read_sheet(googleSheetURL,
                    sheet = "Sample Data") %>%
      clean_names() %>%
      left_join(parties %>% select(party, partyName) %>% 
                  rename(candidatePartyName = partyName), by = "party") %>%
      rename(candidateParty = party,
             wardCode = ward_code,
             candidateName = candidate_name,
             candidateURL = candidate_web_site,
             responseDate = response_date,
             q1_Response = response_q1,
             q2_Response = response_q2,
             q3_Response = response_q3,
             q4_Response = response_q4,
             q1_ResponseCategory = response_1_category,
             q2_ResponseCategory = response_2_category,
             q3_ResponseCategory = response_3_category,
             q4_ResponseCategory = response_4_category
             ) %>%
      mutate(candidateURL = "https://www.bbc.co.uk")
    saveRDS(candidatesAndResponses, localPath)
  }
}

# Get Wards
wardsBase <- getBhamWards()
# Load Candidate Response Data
candidatesAndResponses <- getCandidatesResponses()

# Get just candidate base data
candidatesBase <- candidatesAndResponses %>%
  select(wardCode, candidateName, candidateParty, candidatePartyName, candidateURL)

# Get and make long the candidate responses
candidateResponses <- candidatesAndResponses %>%
  select(wardCode, candidatePartyName, candidateName,
         q1_Response, q2_Response, q3_Response,q4_Response,
         q1_ResponseCategory, q2_ResponseCategory, q3_ResponseCategory, q4_ResponseCategory) %>%
  replace(is.na(.), "Unknown") %>%
  pivot_longer(cols = starts_with('q'), 
    names_to = c("questionNo", ".value"),
    names_sep = "_") %>%
  mutate(questionNo = as.numeric(substr(questionNo,2,2))) %>%
  rename(response = Response,
         responseCategory = ResponseCategory)

# Count responses by candidate and category
responseCountsByCandidate <- candidateResponses %>%
  group_by(wardCode, candidateName) %>%
  summarise(totalCount = n(),
            committedCount = sum(responseCategory == "Committed"),
            notCommittedCount = sum(responseCategory == "Not Committed"),
            noResponseCount = sum(responseCategory == "No Response"),
            responseCount = committedCount + notCommittedCount
  ) %>%
  mutate(otherCount = totalCount - committedCount - notCommittedCount - noResponseCount)

# Count responses by ward and category
responseCountsByWard <- candidateResponses %>%
  group_by(wardCode) %>%
  summarise(totalCount = n(),
            committedCount = sum(responseCategory == "Committed"),
            notCommittedCount = sum(responseCategory == "Not Committed"),
            noResponseCount = sum(responseCategory == "No Response"),
            responseRate = (committedCount + notCommittedCount) / totalCount,
            committedRate = (committedCount) / totalCount
  ) %>%
  mutate(otherCount = totalCount - committedCount - notCommittedCount - noResponseCount)

# Add the counts back into candidate base ready for visualisations
candidates <- candidatesBase %>%
  left_join(responseCountsByCandidate, by = c("wardCode", "candidateName"))

# Add the counts back into candidate base ready for visualisations
wards <- wardsBase %>%
  left_join(responseCountsByWard, by = "wardCode")

# Summarise responses by party and category
candidateResponsesByParty <- candidates %>%
  group_by(candidatePartyName) %>%
  summarise(totalCount = sum(totalCount), 
            committedCount = sum(committedCount),
            notCommittedCount = sum(notCommittedCount),
            noResponseCount = sum(noResponseCount), 
            otherCount= sum(otherCount),
            responseRate = (committedCount + notCommittedCount) / totalCount,
            committedRate = committedCount / totalCount,
            notCommittedRate = notCommittedCount / totalCount
            )

# Get (just) the Birmingham ward boundaries
bhamWardBoundries <- getBhamWardBoundaries(wards)
#sf::st_write(bhamWardBoundries, here::here("downloads", "bhamWardBoundaries.geojson"))
